import { supabase } from '../supabase';
import { StaffMember, MonthlyApproval, ApprovalStatus, User, UserRole, UnauthorizedUser } from '../types';

// A helper to ensure error messages are always strings.
const getErrorMessage = (error: any, defaultMessage: string): string => {
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
        return error.message;
    }
    if (error && typeof error.details === 'string' && error.details.trim() !== '') {
        return error.details;
    }
    return defaultMessage;
};

// --- Authentication Functions ---

export const requestPasswordReset = async (email: string): Promise<void> => {
    const redirectTo = `${window.location.origin}/#/reset-password`;
    // FIX: Use Supabase auth.resetPasswordForEmail, casting to `any` to bypass TypeScript errors.
    const { error } = await (supabase.auth as any).resetPasswordForEmail(email, { redirectTo });
    if (error) {
        console.error("Error requesting password reset:", error);
        // Provide a more user-friendly message for a common case.
        if (error.message.includes('No user found')) {
            throw new Error('No account found with that email address.');
        }
        throw new Error(getErrorMessage(error, 'Failed to send password reset email.'));
    }
};

export const updateUserPassword = async (newPassword: string): Promise<void> => {
    // This function is for an authenticated user, typically after a password recovery flow.
    // FIX: Use Supabase auth.updateUser, casting to `any` to bypass TypeScript errors.
    const { error } = await (supabase.auth as any).updateUser({ password: newPassword });
    if (error) {
        console.error("Error updating password:", error);
        throw new Error(getErrorMessage(error, 'Failed to update password. Your session may have expired.'));
    }
};

export const changeUserPassword = async (email: string, currentPassword: string, newPassword: string): Promise<void> => {
    // Step 1: Re-authenticate to verify the current password. This also refreshes the session,
    // which is a good security practice before sensitive operations.
    const { error: signInError } = await (supabase.auth as any).signInWithPassword({
        email,
        password: currentPassword,
    });

    if (signInError) {
        console.error("Re-authentication failed:", signInError);
        // Provide a more specific error for incorrect password
        if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Your current password is incorrect.');
        }
        throw new Error(getErrorMessage(signInError, 'Failed to verify your current password.'));
    }

    // Step 2: If re-authentication is successful, update the password for the now-confirmed user.
    const { error: updateError } = await (supabase.auth as any).updateUser({ password: newPassword });
    
    if (updateError) {
        console.error("Error updating password:", updateError);
        throw new Error(getErrorMessage(updateError, 'Failed to update your password. Please try again.'));
    }
};


// Gets the start of the current month in 'YYYY-MM-01' format
const getCurrentMonthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

export const uploadProfileImage = async (file: File, staffId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${staffId}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error("Error uploading profile image: ", uploadError.message || JSON.stringify(uploadError));
        throw new Error(getErrorMessage(uploadError, 'Failed to upload profile image.'));
    }

    const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
        throw new Error('Could not get public URL for uploaded image.');
    }

    return data.publicUrl;
};


export const getStaffByEmiscode = async (emiscode: number): Promise<StaffMember[]> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .eq('emiscode', emiscode)
        .or('is_archived.is.false,is_archived.is.null')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching staff by emiscode: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to fetch staff for emiscode ${emiscode}.`));
    }
    return data || [];
};

export const getAllStaffGlobally = async (): Promise<StaffMember[]> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .or('is_archived.is.false,is_archived.is.null')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching all staff globally: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch all staff for report.'));
    }
    return data || [];
};

export const getStaffByStaffId = async (staffId: string): Promise<StaffMember> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .eq('staff_id', staffId)
        .single();

    if (error) {
        console.error("Error fetching staff by staff_id: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to fetch staff with ID ${staffId}.`));
    }
    if (!data) throw new Error('Staff member not found');
    return data;
};

export const getAllIppdStaff = async (
    page: number, 
    pageSize: number, 
    searchTerm: string
): Promise<{ staff: StaffMember[], hasNextPage: boolean }> => {
    const from = page * pageSize;
    const to = from + pageSize; // Fetch one extra to check for next page

    let query = supabase
        .from('ippd')
        .select('*')
        .or('is_archived.is.false,is_archived.is.null');

    if (searchTerm) {
        // FIX: Optimized search to prevent timeouts.
        // If the search term is purely numeric, it's likely a Staff ID.
        // A targeted search on this single column is much faster.
        if (/^\d+$/.test(searchTerm)) {
            query = query.like('staff_id', `%${searchTerm}%`);
        } else {
            // Fallback to full-text search for non-numeric terms (names, schools, etc.)
            // Excluded staff_id from plfts as it's not ideal for numeric-like strings.
            query = query.or(
                `name.plfts.${searchTerm},` +
                `school.plfts.${searchTerm},` +
                `rank.plfts.${searchTerm}`
            );
        }
    } else {
        // On initial load without search, sorting by ID is the most performant.
        query = query.order('id', { ascending: true });
    }
    
    const { data, error } = await query.range(from, to);

    if (error) {
        console.error("Error fetching all ippd staff: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch all staff from IPPD.'));
    }
    
    const staffData = data || [];
    const hasNextPage = staffData.length > pageSize;
    const staffForPage = staffData.slice(0, pageSize);

    return { staff: staffForPage, hasNextPage };
};


export const addStaff = async (
    newStaffData: Omit<StaffMember, 'id' | 'authorised'>,
    profileImageFile?: File
): Promise<StaffMember> => {
    // Step 1: Insert staff data without the image URL
    const { data: insertedStaff, error } = await supabase
        .from('ippd')
        .insert({ ...newStaffData, authorised: false }) // 'authorised' is now legacy, default to false.
        .select()
        .single();
    
    if (error || !insertedStaff) {
        console.error("Error adding staff: ", error?.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to add new staff member.'));
    }

    // Step 2: If there's an image, upload it and update the record
    if (profileImageFile) {
        try {
            const imageUrl = await uploadProfileImage(profileImageFile, insertedStaff.staff_id);
            
            // Step 3: Update the staff member with the image URL
            const { data: updatedStaff, error: updateError } = await supabase
                .from('ippd')
                .update({ profile_image_url: imageUrl })
                .eq('id', insertedStaff.id)
                .select()
                .single();
            
            if (updateError || !updatedStaff) {
                // The record was created, but the image URL failed to save.
                // It's better to throw here so the UI can report the full failure.
                throw new Error(getErrorMessage(updateError, 'Staff created, but failed to save profile image URL.'));
            }
            
            return updatedStaff;

        } catch (uploadError: any) {
            // If image upload or the subsequent update fails, we communicate this failure.
            // The staff record still exists, which might be addressed manually.
            console.error("Failed to upload image during staff creation:", uploadError);
            throw new Error(`Staff member ${insertedStaff.name} was created, but the image upload failed: ${uploadError.message}`);
        }
    }

    return insertedStaff;
};

export const updateStaff = async (staffId: string, updates: Partial<StaffMember>): Promise<StaffMember> => {
    // Create a copy to avoid mutating the original object.
    const updateData = { ...updates };

    // The 'search_vector' column is managed by a DB trigger for full-text search
    // and cannot be set manually. We must remove it from the update payload if it exists.
    // The StaffMember type doesn't know about this column, so we cast to 'any' to delete it.
    delete (updateData as any).search_vector;

    const { data, error } = await supabase
        .from('ippd')
        .update(updateData)
        .eq('id', staffId)
        .select()
        .maybeSingle();
    
    if (error) {
        console.error("Error updating staff: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to update staff with ID ${staffId}.`));
    }
    return data;
};

// --- New Monthly Approval Functions ---

export const getMonthlyApprovals = async (emiscode: number, month: string): Promise<MonthlyApproval[]> => {
    const { data, error } = await supabase
        .from('monthly_approvals')
        .select('*')
        .eq('emiscode', emiscode)
        .eq('month_start_date', month);

    if (error) {
        console.error("Error fetching monthly approvals:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch approvals.'));
    }
    return data || [];
};

export const getAllMonthlyApprovals = async (month: string): Promise<MonthlyApproval[]> => {
    const { data, error } = await supabase
        .from('monthly_approvals')
        .select('*')
        .eq('month_start_date', month);

    if (error) {
        console.error("Error fetching all monthly approvals:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch all approvals for the month.'));
    }
    return data || [];
};

// New function for Teacher Dashboard
export const getStaffMemberMonthlyApproval = async (staffMemberId: string, month: string): Promise<MonthlyApproval | null> => {
    const { data, error } = await supabase
        .from('monthly_approvals')
        .select('*')
        .eq('staff_member_id', staffMemberId)
        .eq('month_start_date', month)
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching staff member's monthly approval:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, "Failed to fetch this month's status."));
    }
    return data;
};


export const setMonthlyApproval = async (
    staffMemberId: string,
    emiscode: number,
    adminId: string,
    status: ApprovalStatus
): Promise<MonthlyApproval> => {
    const month = getCurrentMonthStartDate();

    const approvalData = {
        staff_member_id: staffMemberId,
        month_start_date: month,
        status: status,
        emiscode: emiscode,
        approved_by_user_id: adminId,
    };

    // Upsert ensures we create a new record or update an existing one for the same staff/month.
    const { data, error } = await supabase
        .from('monthly_approvals')
        .upsert(approvalData, { onConflict: 'staff_member_id,month_start_date' })
        .select()
        .single();

    if (error) {
        console.error("Error setting monthly approval:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to set approval status.'));
    }
    return data;
};

// FIX: Added missing function to find a staff member in the master list (ippd table).
export const findStaffInMasterList = async (staffId: string): Promise<StaffMember> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .eq('staff_id', staffId)
        .or('is_archived.is.false,is_archived.is.null')
        .single();

    if (error) {
        console.error("Error finding staff in master list: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to find staff with ID ${staffId}.`));
    }
    if (!data) {
        throw new Error('Staff member not found');
    }
    return data;
};

// FIX: Added missing function to pull a staff member from one school to another.
export const pullStaffFromMasterList = async (
    staffToPull: StaffMember,
    newEmiscode: number,
    newSchool: string,
    newUnit: string | undefined
): Promise<StaffMember> => {
    const { data, error } = await supabase
        .from('ippd')
        .update({
            emiscode: newEmiscode,
            school: newSchool,
            unit: newUnit,
        })
        .eq('id', staffToPull.id)
        .select()
        .single();

    if (error) {
        console.error("Error pulling staff: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to pull staff member ${staffToPull.name}.`));
    }
    return data;
};

// --- Staff Archiving Functions ---

export const getArchivedStaffByEmiscode = async (emiscode: number): Promise<StaffMember[]> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .eq('emiscode', emiscode)
        .is('is_archived', true)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching archived staff by emiscode: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to fetch archived staff for emiscode ${emiscode}.`));
    }
    return data || [];
};

export const getAllArchivedStaffGlobally = async (): Promise<StaffMember[]> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .is('is_archived', true)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching all archived staff globally: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch all archived staff.'));
    }
    return data || [];
};

export const archiveStaff = async (staffId: string): Promise<StaffMember> => {
    const { data, error } = await supabase
        .from('ippd')
        .update({ is_archived: true })
        .eq('id', staffId)
        .select()
        .single();
    
    if (error) {
        console.error("Error archiving staff: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to archive staff member.'));
    }
    return data;
};

export const unarchiveStaff = async (staffId: string): Promise<StaffMember> => {
    const { data, error } = await supabase
        .from('ippd')
        .update({ is_archived: false })
        .eq('id', staffId)
        .select()
        .single();
    
    if (error) {
        console.error("Error un-archiving staff: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to restore staff member from archive.'));
    }
    return data;
};


// --- Teacher Authorization Functions ---
export const getIppdStaffByEmiscodeForAuth = async (emiscode: number): Promise<StaffMember[]> => {
    const { data, error } = await supabase
        .from('ippd')
        .select('*')
        .eq('emiscode', emiscode)
        .or('is_archived.is.false,is_archived.is.null')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching staff for authorization:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch staff for authorization management.'));
    }
    return data || [];
};


export const authorizeUser = async (staffId: string): Promise<StaffMember> => {
    // This function now correctly updates the 'authorised' flag in the 'ippd' table.
    const { data, error } = await supabase
        .from('ippd')
        .update({ authorised: true })
        .eq('staff_id', staffId)
        .select()
        .single();
    
    if (error) {
        console.error("Error authorizing user: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, `Failed to authorize user with Staff ID ${staffId}.`));
    }
    return data;
};

export const authorizeMultipleUsers = async (staffIds: string[]): Promise<void> => {
    if (staffIds.length === 0) return;
    const { error } = await supabase
        .from('ippd')
        .update({ authorised: true })
        .in('staff_id', staffIds);

    if (error) {
        console.error("Error authorizing multiple users:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to authorize selected users.'));
    }
};

export const revokeMultipleUsersAuthorization = async (staffIds: string[]): Promise<void> => {
    if (staffIds.length === 0) return;
    const { error } = await supabase
        .from('ippd')
        .update({ authorised: false })
        .in('staff_id', staffIds);

    if (error) {
        console.error("Error revoking authorization for multiple users:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to revoke authorization for selected users.'));
    }
};

export const rejectUserSignups = async (userIds: string[]): Promise<void> => {
    // This function assumes a Supabase RPC 'delete_users_by_ids' exists,
    // which takes an array of user UUIDs and has the necessary privileges to delete from auth.users.
    const { error } = await supabase.rpc('delete_users_by_ids', { user_ids_to_delete: userIds });

    if (error) {
        console.error("Error rejecting user signups:", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to reject selected users. The database function may be missing or has failed.'));
    }
};

export const getDistinctSchools = async (): Promise<{ emiscode: number; school: string }[]> => {
    // The RPC 'get_distinct_schools' was not found. 
    // This implementation queries the ippd table directly and dedupes the schools on the client-side.
    const { data, error } = await supabase
        .from('ippd')
        .select('emiscode, school');

    if (error) {
        console.error("Error fetching distinct schools: ", error.message || JSON.stringify(error));
        throw new Error(getErrorMessage(error, 'Failed to fetch school list.'));
    }
    
    if (!data) {
        return [];
    }

    // Use a Map to efficiently get unique schools by emiscode.
    const uniqueSchoolsMap = new Map<number, string>();
    for (const item of data) {
        // Ensure both emiscode and school are present and we haven't already stored this emiscode.
        // This implicitly takes the first school name found for a given emiscode.
        if (item.emiscode && item.school && !uniqueSchoolsMap.has(item.emiscode)) {
            uniqueSchoolsMap.set(item.emiscode, item.school);
        }
    }

    const uniqueSchoolList = Array.from(uniqueSchoolsMap, ([emiscode, school]) => ({ emiscode, school }));

    // Sort the final list alphabetically by school name.
    return uniqueSchoolList.sort((a, b) => a.school.localeCompare(b.school));
};