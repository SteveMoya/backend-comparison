import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateUserDto } from "./user.dto";

describe("CreateUserDto", () => {
  it("rejects an invalid email", async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: "Jane Doe",
      email: "not-an-email",
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain("email");
  });

  it("accepts a valid payload", async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: "Jane Doe",
      email: "jane@example.com",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
