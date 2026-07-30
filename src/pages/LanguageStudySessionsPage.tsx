import { useState } from "react";
import { BookOpenCheck, Users } from "lucide-react";

import {
  LanguageStudyFilters,
  LanguageStudyMissionaryCard,
  LanguageStudySummary,
} from "../components/languageStudySessions";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "../components/layout";
import { useDistricts } from "../hooks/useDistricts";
import { useLanguageStudySessions } from "../hooks/useLanguageStudySessions";
import { toLocalDateKey } from "../utils/localDate";
import "../styles/language-study-sessions.css";

function LanguageStudySessionsPage() {
  const {
    districts,
    loading: districtsLoading,
    error: districtsError,
  } = useDistricts();

  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null
  );
  const [dateKey, setDateKey] = useState(() => toLocalDateKey());

  const effectiveDistrictId =
    selectedDistrictId &&
    districts.some((district) => district.id === selectedDistrictId)
      ? selectedDistrictId
      : (districts[0]?.id ?? "");

  const { dayView, loading: sessionsLoading, error: sessionsError } =
    useLanguageStudySessions(effectiveDistrictId || null, dateKey);

  const loading =
    districtsLoading || (Boolean(effectiveDistrictId) && sessionsLoading);

  return (
    <PageContainer className="lss-page">
      <PageHeader
        title="Language Study Sessions"
        description="Review today's language study submissions for one district at a time."
      />

      <div className="tt-page-stack">
        {districtsLoading && (
          <p className="lss-status" role="status">
            Loading districts...
          </p>
        )}

        {!districtsLoading && districtsError && (
          <p className="tt-form-error" role="alert">
            {districtsError}
          </p>
        )}

        {!districtsLoading && !districtsError && districts.length === 0 && (
          <EmptyState
            icon={Users}
            title="No districts yet"
            description="Add a district first so you can review Language Study Sessions by district."
          />
        )}

        {!districtsLoading && !districtsError && districts.length > 0 && (
          <>
            <SectionCard title="Filters">
              <LanguageStudyFilters
                districts={districts}
                districtId={effectiveDistrictId}
                dateKey={dateKey}
                onDistrictChange={setSelectedDistrictId}
                onDateChange={setDateKey}
              />
            </SectionCard>

            {loading && (
              <p className="lss-status" role="status">
                Loading Language Study Sessions...
              </p>
            )}

            {!loading && sessionsError && (
              <p className="tt-form-error" role="alert">
                {sessionsError}
              </p>
            )}

            {!loading && !sessionsError && dayView && dayView.totalCount === 0 && (
              <EmptyState
                icon={Users}
                title="No missionaries in this district"
                description="Add missionaries to a companionship in this district to start reviewing Language Study Sessions."
              />
            )}

            {!loading && !sessionsError && dayView && dayView.totalCount > 0 && (
              <>
                <LanguageStudySummary
                  dateKey={dayView.dateKey}
                  submittedCount={dayView.submittedCount}
                  missingCount={dayView.missingCount}
                  totalCount={dayView.totalCount}
                />

                <SectionCard
                  title="Missionaries"
                  description="Expand a card to read that missionary's complete Language Study Session."
                >
                  <div className="lss-missionary-list">
                    {dayView.missionaries.map((row) => (
                      <LanguageStudyMissionaryCard
                        key={row.missionary.id}
                        row={row}
                      />
                    ))}
                  </div>
                </SectionCard>
              </>
            )}

            {!loading && !sessionsError && !dayView && (
              <EmptyState
                icon={BookOpenCheck}
                title="Unable to load sessions"
                description="Try selecting the district or date again."
              />
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default LanguageStudySessionsPage;
