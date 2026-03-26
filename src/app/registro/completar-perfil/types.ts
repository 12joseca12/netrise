export type ProfileRole = "agency" | "freelancer" | "closer";

export interface AgencyProfile {
  photoUrl: string;
  bannerUrl: string;
  agencyName: string;
  website: string;
  country: string;
  city: string;
  services: string[];
  niches: string[];
  citiesOperate: string[];
  avgTicket: string;
  commissionCloser: number; // 0-100 or similar
  bio: string;
}

export interface FreelancerProfile {
  photoUrl: string;
  bannerUrl: string;
  tradeName: string;
  portfolio: string;
  country: string;
  city: string;
  services: string[];
  niches: string[];
  citiesOperate: string[];
  avgTicket: string;
  bio: string;
}

export interface CloserProfile {
  photoUrl: string;
  bannerUrl: string;
  country: string;
  languages: string[];
  salesExperience: string;
  salesSpecialties: string[];
  industries: string[];
  avgTicketClose: string;
  minCommission: string;
  salesRoleType: string;
  availability: string;
  bio: string;
}

export type ProfileFormState = AgencyProfile | FreelancerProfile | CloserProfile;

export const emptyAgencyProfile: AgencyProfile = {
  photoUrl: "",
  bannerUrl: "",
  agencyName: "",
  website: "",
  country: "",
  city: "",
  services: [],
  niches: [],
  citiesOperate: [],
  avgTicket: "",
  commissionCloser: 0,
  bio: "",
};

export const emptyFreelancerProfile: FreelancerProfile = {
  photoUrl: "",
  bannerUrl: "",
  tradeName: "",
  portfolio: "",
  country: "",
  city: "",
  services: [],
  niches: [],
  citiesOperate: [],
  avgTicket: "",
  bio: "",
};

export const emptyCloserProfile: CloserProfile = {
  photoUrl: "",
  bannerUrl: "",
  country: "",
  languages: [],
  salesExperience: "",
  salesSpecialties: [],
  industries: [],
  avgTicketClose: "",
  minCommission: "",
  salesRoleType: "",
  availability: "",
  bio: "",
};
