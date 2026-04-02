import {PassageBuilderPageClient} from "../../_components/PassageBuilderPageClient"

type BuilderPageProps = {
  params: Promise<{
    passageId: string
  }>
}

export default async function ContentBankPassageBuilderPage({params}: BuilderPageProps) {
  const {passageId} = await params
  return <PassageBuilderPageClient passageId={passageId} />
}
