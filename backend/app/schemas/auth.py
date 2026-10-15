"""Modele rejestracji, logowania i sesji — z walidacją danych od klienta."""

from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, StringConstraints, field_validator

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
MIN_NAME_LENGTH = 2
MAX_NAME_LENGTH = 100

LoginPassword = Annotated[str, StringConstraints(min_length=1, max_length=MAX_PASSWORD_LENGTH)]
NewPassword = Annotated[
    str, StringConstraints(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)
]
PersonName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=MIN_NAME_LENGTH, max_length=MAX_NAME_LENGTH
    ),
]


class LoginInput(BaseModel):
    """Dane z formularza logowania."""

    email: EmailStr
    password: LoginPassword

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class RegisterInput(LoginInput):
    """Dane z formularza rejestracji."""

    full_name: PersonName
    password: NewPassword


class AuthSession(BaseModel):
    """Token dostępu, który klient dołącza do kolejnych żądań."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"
