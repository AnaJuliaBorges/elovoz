export { useProfile, PROFILE_QUERY_KEY } from "./hooks/useProfile";
export { useLogin } from "./hooks/useLogin";
export { useLogout } from "./hooks/useLogout";

export {
  fetchCurrentProfile,
  fetchProfile,
  updateProfile,
} from "./services/profiles";

// o visitante navega sem conta; ações de doador abrem este diálogo
export { AuthRequiredDialog } from "./components/AuthRequiredDialog";

export {
  HOME_BY_USER_TYPE,
  homeFor,
  type Profile,
  type UserType,
} from "./model/profile";
