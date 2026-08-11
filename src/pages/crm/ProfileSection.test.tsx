import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileSection } from "@/pages/crm/ManagementSections";
import { useAppStore } from "@/stores/useAppStore";

describe("ProfileSection", () => {
  const changePassword = vi.fn(async () => undefined);

  beforeEach(() => {
    changePassword.mockClear();
    useAppStore.setState({
      session: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Управляющий",
        phone: "+996 555 000 000",
        email: "admin@example.com",
        role: "admin",
      },
      loading: false,
      changePassword,
    });
  });

  it("показывает рабочую форму смены пароля", async () => {
    const user = userEvent.setup();
    render(<ProfileSection />);

    await user.type(screen.getByLabelText("Текущий пароль"), "old-password");
    await user.type(screen.getByLabelText("Новый пароль"), "new-password-123");
    await user.type(screen.getByLabelText("Повторите новый пароль"), "new-password-123");
    await user.click(screen.getByRole("button", { name: "Изменить пароль" }));

    expect(changePassword).toHaveBeenCalledWith("old-password", "new-password-123");
  });

  it("не отправляет несовпадающие пароли", async () => {
    const user = userEvent.setup();
    render(<ProfileSection />);

    await user.type(screen.getByLabelText("Текущий пароль"), "old-password");
    await user.type(screen.getByLabelText("Новый пароль"), "new-password-123");
    await user.type(screen.getByLabelText("Повторите новый пароль"), "another-password");
    await user.click(screen.getByRole("button", { name: "Изменить пароль" }));

    expect(changePassword).not.toHaveBeenCalled();
  });
});
