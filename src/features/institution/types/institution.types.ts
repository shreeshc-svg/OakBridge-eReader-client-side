export interface InstitutionMember {
     id: string;
     username: string;
     email: string;
     role: string;
     createdAt: string;
}

export interface GetMembersResponse {
     message: string;
     members: InstitutionMember[];
}

export interface AddMemberPayload {
     username: string;
     email: string;
     password: string;
}

export interface AddMemberResponse {
     message: string;
     member: InstitutionMember;
}

export interface RemoveMemberResponse {
     message: string;
}
