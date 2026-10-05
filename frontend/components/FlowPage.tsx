import type { ReactNode } from "react";
import { FamilyBand } from "@/components/FamilyBand";
import { Screen } from "@/components/ui";

type Props = {
  showBand?: boolean;
  bandActions?: ReactNode;
  title?: string;
  lead?: string;
  narrow?: boolean;
  center?: boolean;
  primary?: ReactNode;
  secondary?: ReactNode;
  busy?: boolean;
  live?: "polite" | "assertive";
  children?: ReactNode;
};

/** 가족 밴드 + 일반 Screen. care·link 흐름 UI 통일. */
export function FlowPage({
  showBand = true,
  bandActions,
  title,
  lead,
  narrow = true,
  center,
  primary,
  secondary,
  busy,
  live,
  children,
}: Props) {
  return (
    <>
      {showBand ? <FamilyBand actions={bandActions} /> : null}
      <Screen
        className="page-flow"
        title={title}
        lead={lead}
        narrow={narrow}
        center={center}
        primary={primary}
        secondary={secondary}
        busy={busy}
        live={live}
      >
        {children}
      </Screen>
    </>
  );
}
