type SectionHeaderProps = {
  title: string;
  description?: string;
};

/** Section title inside a missionary content card. */
export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="missionary-section-header">
      <h2 className="missionary-section-header__title">{title}</h2>
      {description && (
        <p className="missionary-section-header__description">{description}</p>
      )}
    </div>
  );
}
