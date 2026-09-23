/** Interesse de um doador numa necessidade (RF06). */
export interface Interest {
  id: string;
  need_id: string;
  donor_id: string;
  message: string | null;
  expected_quantity: number | null;
  expected_deadline: string | null;
  created_at: string;
}
