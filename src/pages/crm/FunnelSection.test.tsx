import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockLeads, mockManagers } from "@/mock-data/crm";
import { FunnelSection } from "@/pages/crm/OperationsSections";
import { useAppStore } from "@/stores/useAppStore";

describe("FunnelSection", () => {
  const changeLeadStatus = vi.fn(async () => undefined);
  const confirmedLead = { ...mockLeads[3], status: "confirmed" as const };

  beforeEach(() => {
    changeLeadStatus.mockClear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    useAppStore.setState({
      session: {
        id: "admin-1",
        name: "Управляющий",
        phone: "+996 555 000 000",
        email: "admin@example.com",
        role: "admin",
      },
      leads: [confirmedLead],
      managers: mockManagers,
      changeLeadStatus,
    });
  });

  it("даёт выбрать следующий курьерский этап с клавиатуры и на телефоне", async () => {
    const user = userEvent.setup();
    render(<FunnelSection role="admin" />);

    const statusSelect = screen.getByLabelText(`Статус ${confirmedLead.number}`);
    expect(screen.getByRole("option", { name: "Курьер забрал товар" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Взято в работу" })).not.toBeInTheDocument();
    await user.selectOptions(statusSelect, "courier_picked_up");

    expect(changeLeadStatus).toHaveBeenCalledWith(
      confirmedLead.id,
      "courier_picked_up",
      "Статус изменён в карточке воронки",
    );
  });

  it("не завершает заказ без явного подтверждения", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();
    render(<FunnelSection role="admin" />);

    await user.selectOptions(
      screen.getByLabelText(`Статус ${confirmedLead.number}`),
      "completed",
    );

    expect(changeLeadStatus).not.toHaveBeenCalled();
  });
});
