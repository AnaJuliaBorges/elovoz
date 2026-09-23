export { useMyOng, MY_ONG_QUERY_KEY } from "./hooks/useMyOng";

export { fetchMyOng } from "./services/ongs";

export type { MyOng, VerificationStatus } from "./model/ong";

// os horários de funcionamento são preenchidos no cadastro (feature `auth`) e
// editados no painel, então o formulário e o modelo são públicos
export { OpeningHoursFields } from "./components/OpeningHoursFields";

export {
  emptyOpeningHoursForm,
  openingHoursErrors,
  openingHoursToRows,
  toOpeningHoursForm,
  type OpeningHour,
  type OpeningHoursFormInput,
} from "./model/openingHours";
