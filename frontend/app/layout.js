import "./globals.css";

export const metadata = {
  title: "CodeSutra — Bridge Traditional Medicine with Modern Clinical Coding",
  description: "CodeSutra is a FHIR R4 terminology microservice that dual-codes NAMASTE traditional medicine terms with ICD-11 TM2 concepts for seamless clinical documentation."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
