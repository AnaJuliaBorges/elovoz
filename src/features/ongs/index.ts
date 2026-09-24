export { useMyOng, MY_ONG_QUERY_KEY } from "./hooks/useMyOng";

export {
  fetchMyOng,
  fetchOngsForReview,
  setOngVerificationStatus,
} from "./services/ongs";

export {
  formatFullAddress,
  type MyOng,
  type OngForReview,
  type VerificationStatus,
} from "./model/ong";

// o admin revisa os mesmos contatos que o perfil público mostra
export { OngContacts } from "./components/OngContacts";

// a lista de ONGs seguidas aparece em "Minhas doações" (feature `donations`)
export { FollowedOngsList } from "./components/FollowedOngsList";

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
