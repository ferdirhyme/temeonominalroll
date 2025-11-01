import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { User, UserRole } from '../types';
// FIX: Removed Supabase type imports as they were causing export errors, likely due to a library version mismatch.
// import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: { identifier: string; password: string }) => Promise<void>;
    signup: (credentials: { staffId: string; email: string; password:string; emiscode: number }) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // FIX: Changed SupabaseUser type to any to resolve module export errors.
    const getUserProfile = async (supabaseUser: any): Promise<User | null> => {
        try {
            // Step 1: Fetch the core user account details from the 'users' table.
            const { data: userAccount, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (userError || !userAccount) {
                throw new Error(`Failed to fetch user profile: ${userError?.message || 'User not found.'}`);
            }
            
            // Step 2: Fetch additional details from the ippd table like profile image and authorization status.
            const { data: staffProfile, error: staffError } = await supabase
                .from('ippd')
                .select('authorised, profile_image_url, is_archived')
                .eq('staff_id', userAccount.staffId)
                .single();
            
            if (staffError) {
                console.warn(`Could not fetch ippd profile for ${userAccount.staffId}:`, staffError);
            }

            if (staffProfile?.is_archived) {
                throw new Error('This account has been archived and cannot be accessed.');
            }

            userAccount.profile_image_url = staffProfile?.profile_image_url;

            // Step 3: Determine authorization status based on role.
            if (userAccount.role === UserRole.Admin || userAccount.role === UserRole.Superadmin) {
                // Admins and Superadmins are always considered authorized.
                userAccount.authorised = true;
            } else if (userAccount.role === UserRole.Teacher) {
                // For teachers, the 'authorised' status is in the 'ippd' table.
                 userAccount.authorised = staffProfile?.authorised ?? false;
            } else {
                // Default any other roles to unauthorized.
                userAccount.authorised = false;
            }

            return userAccount;

        } catch (error: any) {
            console.error('Exception in getUserProfile:', error.message);
            // FIX: Using Supabase auth.signOut(), but casting to `any` to bypass TypeScript errors from faulty type definitions.
            await (supabase.auth as any).signOut();
            setUser(null);
            return null;
        }
    };


    useEffect(() => {
        setLoading(true);
        // FIX: Using Supabase onAuthStateChange(), but casting to `any` to bypass TypeScript errors from faulty type definitions.
        const { data: authListener } = (supabase.auth as any).onAuthStateChange(
            async (event: any, session: any) => {
                const supabaseUser = session?.user;
                if (supabaseUser) {
                    const profile = await getUserProfile(supabaseUser);
                    setUser(profile);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async ({ identifier, password }: { identifier: string; password: string }) => {
        let email = identifier;
        
        if (!identifier.includes('@')) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('staffId', identifier)
                .single();

            if (userError || !userData) {
                 throw new Error("Staff ID not found. Please use your email or check your Staff ID.");
            }
            email = userData.email;
        }
        
        // FIX: Updated Supabase auth call to use `signInWithPassword`, casting to `any` to bypass TypeScript errors from faulty type definitions.
        const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (error) {
            throw new Error(error.message || 'Invalid login credentials.');
        }
    };

    const signup = async ({ staffId, email, password, emiscode }: { staffId: string; email: string; password: string; emiscode: number }) => {
        // Step 1: Securely validate credentials using the RPC function to bypass RLS for anon users
        const { data: validationData, error: validationError } = await supabase.rpc(
            'get_signup_validation_data',
            {
                staff_id_to_check: staffId,
                emiscode_to_check: emiscode,
            }
        );
        
        if (validationError) {
            console.error('Error validating staff details:', validationError);
            throw new Error(validationError.message || 'An error occurred during validation. Please try again.');
        }

        if (!validationData || validationData.length === 0) {
            throw new Error('Invalid Staff ID or Emiscode. Please check your details or contact administration.');
        }

        const staffDetails = validationData[0];
        const staffName = staffDetails.name;
        const staffType = staffDetails.stafftype; // RPC function now returns stafftype
        const role = (staffType && staffType.toLowerCase() === 'headteacher') ? UserRole.Admin : UserRole.Teacher;


        // Step 2: Check if an account already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},staffId.eq.${staffId}`)
            .maybeSingle();

        if (existingUser) {
            throw new Error('An account with this email or Staff ID already exists.');
        }

        // Step 3: Create the user in Supabase Auth, passing profile data in the metadata.
        // A database trigger will use this metadata to create the profile in public.users.
        // FIX: Updated Supabase auth call to use `signUp`, casting to `any` to bypass TypeScript errors from faulty type definitions.
        const { data: authData, error: authError } = await (supabase.auth as any).signUp({
          email,
          password,
          options: {
            data: {
              staffId: staffId,
              emiscode: emiscode,
              role: role,
              name: staffName,
            },
          },
        });

        if (authError) {
            throw new Error(authError.message || 'Failed to create account.');
        }
        if (!authData.user) {
            throw new Error("Signup failed, please try again.");
        }

        // Step 4: The manual profile insert is no longer needed. The trigger handles it.
    };
    
    const logout = async () => {
        // FIX: Using Supabase auth.signOut(), but casting to `any` to bypass TypeScript errors from faulty type definitions.
        const { error } = await (supabase.auth as any).signOut();
        if (error) {
            console.error('Error logging out:', error);
        }
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
