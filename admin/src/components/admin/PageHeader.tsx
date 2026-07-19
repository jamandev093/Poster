interface Props {
  title: string;
  description: string;
  eyebrow?: string;
}

export default function PageHeader({
  title,
  description,
  eyebrow,
}: Props) {
  return (
    <header className="page-header">
      {eyebrow ? (
        <div className="eyebrow">
          {eyebrow}
        </div>
      ) : null}

      <h2>{title}</h2>

      <p>{description}</p>
    </header>
  );
}