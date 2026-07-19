import PageHeader from "@/components/admin/PageHeader";

interface Props { title: string; description: string; note: string; }

export default function SimplePlaceholderPage({ title, description, note }: Props) {
  return <div className="stack"><PageHeader title={title} description={description}/><section className="panel empty"><div className="empty-icon">•</div><h3>Simple by design</h3><p>{note}</p></section></div>;
}
