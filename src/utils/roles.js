export const ROLE_SHORT = { tl: "TL", pm: "PM", member: "QA" };

// The ONE place that decides who can do what.
export const ROLE_LABELS = {
  tl: "Team Lead",
  pm: "Project Manager",
  member: "QA Engineer",
};

// To allow only Team Leads, change this to: (role) => role === "tl"
export const canUploadTemplates = (role) => role === "tl" || role === "pm";

// Who can add / edit projects and environment URLs
export const canManageEnvironments = (role) => role === "tl" || role === "pm";

// Who can see the Admin Settings tab
export const canAccessAdmin = (role) => role === "tl" || role === "pm";
