export function ContactLine({ phone, email }: { phone: string | null; email: string | null }) {
  if (!phone && !email) return <>No contact info</>;
  return (
    <>
      {phone && (
        <a href={`tel:${phone}`} className="hover:text-emerald-400 hover:underline">
          {phone}
        </a>
      )}
      {phone && email && " · "}
      {email && (
        <a href={`mailto:${email}`} className="hover:text-emerald-400 hover:underline">
          {email}
        </a>
      )}
    </>
  );
}
