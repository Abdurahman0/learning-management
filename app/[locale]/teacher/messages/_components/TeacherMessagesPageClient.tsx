"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  getTeacherMessagesConversationData,
  getTeacherProfile,
  sendTeacherMessage,
  type TeacherMessagesConversationData,
  type TeacherMessagesPageData
} from "@/data/teacher/selectors";
import {cn} from "@/lib/utils";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherChatPanel} from "./TeacherChatPanel";
import {TeacherConversationList} from "./TeacherConversationList";
import {TeacherConversationSearch} from "./TeacherConversationSearch";
import {TeacherStudentInfoSidebar} from "./TeacherStudentInfoSidebar";

type TeacherMessagesPageClientProps = {
  initialData: TeacherMessagesPageData;
  initialConversation: TeacherMessagesConversationData | null;
  initialSearch?: string;
};

export function TeacherMessagesPageClient({
  initialData,
  initialConversation,
  initialSearch = ""
}: TeacherMessagesPageClientProps) {
  const t = useTranslations("teacherMessages");
  const teacher = useMemo(() => getTeacherProfile(), []);

  const [conversations, setConversations] = useState(initialData.conversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialData.selectedConversationId);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [composerValue, setComposerValue] = useState("");
  const [messageVersion, setMessageVersion] = useState(0);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const selectedConversationData = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }

    if (messageVersion === 0 && initialConversation?.conversation.id === selectedConversationId) {
      return initialConversation;
    }

    return getTeacherMessagesConversationData(selectedConversationId);
  }, [initialConversation, messageVersion, selectedConversationId]);

  const selectedConversationMerged = useMemo(() => {
    if (!selectedConversationData) {
      return null;
    }

    const override = conversations.find((conversation) => conversation.id === selectedConversationData.conversation.id);
    if (!override) {
      return selectedConversationData;
    }

    return {
      ...selectedConversationData,
      conversation: override
    };
  }, [conversations, selectedConversationData]);

  const filteredConversations = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return conversations;
    }

    return conversations.filter((item) => {
      return (
        item.studentName.toLowerCase().includes(normalized)
        || item.lastMessagePreview.toLowerCase().includes(normalized)
      );
    });
  }, [conversations, searchQuery]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMobileView("chat");
    setConversations((current) =>
      current.map((item) => (item.id === conversationId ? {...item, unreadCount: 0} : item))
    );
  };

  const handleSendMessage = () => {
    const active = selectedConversationMerged;
    if (!active) {
      return;
    }

    const created = sendTeacherMessage({
      conversationId: active.conversation.id,
      studentId: active.conversation.studentId,
      text: composerValue
    });

    if (!created) {
      return;
    }

    setComposerValue("");
    setMessageVersion((value) => value + 1);

    setConversations((current) =>
      [...current]
        .map((item) =>
          item.id === active.conversation.id
            ? {
              ...item,
              unreadCount: 0,
              lastMessagePreview: created.text,
              lastMessageAt: created.createdAt,
              lastMessageTime: created.time
            }
            : item
        )
        .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime())
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar
            title={t("title")}
            search={{
              value: searchQuery,
              onValueChange: setSearchQuery,
              placeholder: t("searchPlaceholder")
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
            </section>

            <section className="grid min-w-0 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
              <Card className={cn("rounded-2xl border-border/70 bg-card/75 py-0", mobileView === "chat" ? "hidden md:block" : "block")}>
                <CardHeader className="pt-6 pb-3">
                  <CardTitle className="text-xl">{t("conversations")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-5">
                  <TeacherConversationSearch value={searchQuery} onChange={setSearchQuery} />
                  <TeacherConversationList
                    conversations={filteredConversations}
                    selectedConversationId={selectedConversationId}
                    onSelect={handleSelectConversation}
                  />
                </CardContent>
              </Card>

              <div className={cn("min-w-0", mobileView === "list" ? "hidden md:block" : "block")}>
                <TeacherChatPanel
                  conversationData={selectedConversationMerged}
                  teacherInitials={teacher.avatarFallback}
                  composerValue={composerValue}
                  onComposerChange={setComposerValue}
                  onSend={handleSendMessage}
                  onBackToList={() => setMobileView("list")}
                />
              </div>

              <div className="hidden xl:block">
                <TeacherStudentInfoSidebar conversationData={selectedConversationMerged} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
