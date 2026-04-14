import type { Medication } from "@/shared/types/api";

export function MedicationTable({
  medications,
}: {
  medications: Medication[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface-lowest">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-surface-low text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            <th className="px-4 py-2.5">Medication</th>
            <th className="px-4 py-2.5">Dosage</th>
            <th className="px-4 py-2.5">Frequency</th>
            <th className="px-4 py-2.5">Duration</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, i) => (
            <tr
              key={i}
              className="border-t border-outline-variant/15"
            >
              <td className="px-4 py-2.5 font-medium text-on-surface">
                {med.name}
              </td>
              <td className="px-4 py-2.5 text-on-surface-variant">
                {med.dosage}
              </td>
              <td className="px-4 py-2.5 text-on-surface-variant">
                {med.frequency}
              </td>
              <td className="px-4 py-2.5 text-on-surface-variant">
                {med.duration ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
