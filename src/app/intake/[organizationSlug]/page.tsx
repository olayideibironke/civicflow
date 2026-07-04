import PublicIntakeForm from "@/components/PublicIntakeForm";

type OrganizationIntakePageProps = {
  params: Promise<{
    organizationSlug: string;
  }>;
};

export default async function OrganizationIntakePage({
  params,
}: OrganizationIntakePageProps) {
  const { organizationSlug } = await params;

  return <PublicIntakeForm organizationSlug={organizationSlug} />;
}