import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { FollowedOngsList } from "@/features/ongs";
import { MyInterestsList } from "../components/MyInterestsList";

/** "Minhas doações": interesses manifestados e instituições seguidas. */
export default function MyDonationsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-medium">Minhas doações</h1>

      <Tabs defaultValue="interesses" className="gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="interesses">Interesses</TabsTrigger>
          <TabsTrigger value="seguindo">Instituições que sigo</TabsTrigger>
        </TabsList>

        <TabsContent value="interesses">
          <MyInterestsList />
        </TabsContent>

        <TabsContent value="seguindo">
          <FollowedOngsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
