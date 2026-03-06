export type ProfileRole = "agency" | "freelancer" | "closer";

export interface AgencyProfile {
  photoUrl: string;
  agencyName: string;
  website: string;
  country: string;
  city: string;
  services: string[];
  niches: string[];
  citiesOperate: string[];
  avgTicket: string;
  commissionCloser: number; // 0-100 or similar
}

export interface FreelancerProfile {
  photoUrl: string;
  tradeName: string;
  portfolio: string;
  country: string;
  city: string;
  services: string[];
  niches: string[];
  citiesOperate: string[];
  avgTicket: string;
}

export interface CloserProfile {
  photoUrl: string;
  country: string;
  languages: string[];
  salesExperience: string;
  salesSpecialties: string[];
  industries: string[];
  avgTicketClose: string;
  minCommission: string;
  salesRoleType: string;
  availability: string;
}

export type ProfileFormState = AgencyProfile | FreelancerProfile | CloserProfile;

export const emptyAgencyProfile: AgencyProfile = {
  photoUrl: "",
  agencyName: "",
  website: "",
  country: "",
  city: "",
  services: [],
  niches: [],
  citiesOperate: [],
  avgTicket: "",
  commissionCloser: 0,
};

export const emptyFreelancerProfile: FreelancerProfile = {
  photoUrl: "",
  tradeName: "",
  portfolio: "",
  country: "",
  city: "",
  services: [],
  niches: [],
  citiesOperate: [],
  avgTicket: "",
};

export const emptyCloserProfile: CloserProfile = {
  photoUrl: "",
  country: "",
  languages: [],
  salesExperience: "",
  salesSpecialties: [],
  industries: [],
  avgTicketClose: "",
  minCommission: "",
  salesRoleType: "",
  availability: "",
};
