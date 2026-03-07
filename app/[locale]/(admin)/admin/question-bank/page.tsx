import {redirect} from "next/navigation"

type LegacyQuestionBankPageProps = {
  params: Promise<{locale: string}>
}

export default async function LegacyQuestionBankPage({params}: LegacyQuestionBankPageProps) {
  const {locale} = await params
  redirect(`/${locale}/admin/content-bank`)
}

