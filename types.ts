// Fix: Removed erroneous file header which was causing a parsing error.
export enum UserRole {
    Admin = 'admin',
    Teacher = 'teacher',
    Superadmin = 'superadmin',
}

export enum StaffStatus {
    AtPost = 'AT POST',
    OnLeave = 'ON LEAVE',
    Transferred = 'TRANSFERRED',
    VacatedPost = 'VACATED POST',
}

export enum ApprovalStatus {
    Approved = 'Approved',
    Disapproved = 'Disapproved',
}

export interface MonthlyApproval {
    id: string;
    staff_member_id: string;
    month_start_date: string; // YYYY-MM-DD
    status: ApprovalStatus;
    emiscode: number;
    approved_by_user_id: string;
    approved_at: string;
}

export interface User {
    id: string; // auth.users.id (UUID)
    staffId: string;
    email: string;
    emiscode: number;
    role: UserRole;
    name: string;
    profile_image_url?: string;
    authorised: boolean;
}

export interface UnauthorizedUser extends User {
    school: string;
    rank?: string;
}

export interface StaffMember {
    id: string; // row UUID
    staff_id: string;
    name: string;
    dob?: string;
    phone?: string;
    ssnit?: string;
    gh_card?: string;
    rank?: string;
    unit?: string;
    school: string;
    emiscode: number;
    bank_name?: string;
    bank_branch?: string;
    account?: string;
    status: StaffStatus;
    status_desc?: string;
    nhis?: string;
    ntc_num?: string;
    acad_qual?: string;
    date_obtained_acad?: string;
    prof_qual?: string;
    date_obtained_prof?: string;
    level?: string;
    subject?: string;
    resident_add?: string;
    residential_gps?: string;
    email: string;
    date_promoted?: string;
    date_first_app?: string;
    date_posted_present_sta?: string;
    phone2?: string;
    authorised: boolean;
    profile_image_url?: string;
    stafftype?: string;
    is_archived?: boolean;
}

export interface StatusUpdate {
    status: StaffStatus;
    description: string;
    updatedAt: string;
    updatedBy: string;
}
