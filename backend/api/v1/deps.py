from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.application.services.consultation_orchestrator import ConsultationOrchestrator
from backend.application.use_cases.auth_use_cases import LoginUseCase, RegisterUserUseCase
from backend.application.use_cases.create_consultation_use_case import CreateConsultationUseCase
from backend.application.use_cases.get_consultation_use_case import GetConsultationUseCase
from backend.application.use_cases.get_report_use_case import GetReportUseCase
from backend.application.use_cases.list_consultations_use_case import ListConsultationsUseCase
from backend.core.config import get_settings
from backend.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.infrastructure.clients.http_ai_engine_client import HttpAiEngineClient
from backend.infrastructure.db.session import get_session
from backend.infrastructure.repositories.sqlalchemy_consultation_repository import (
    SqlAlchemyConsultationRepository,
)
from backend.infrastructure.repositories.sqlalchemy_report_repository import (
    SqlAlchemyReportRepository,
)
from backend.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from backend.infrastructure.storage.local_audio_storage import LocalAudioStorage

_bearer = HTTPBearer()


# ---------------------------------------------------------------------------
# Repository factories (session-scoped)
# ---------------------------------------------------------------------------

def get_user_repo(session=Depends(get_session)):
    return SqlAlchemyUserRepository(session)


def get_consultation_repo(session=Depends(get_session)):
    return SqlAlchemyConsultationRepository(session)


def get_report_repo(session=Depends(get_session)):
    return SqlAlchemyReportRepository(session)


# ---------------------------------------------------------------------------
# Infrastructure (singletons created at startup via lifespan, injected here)
# ---------------------------------------------------------------------------

def get_ai_engine_client():
    settings = get_settings()
    return HttpAiEngineClient(
        base_url=settings.ai_engine_url,
        timeout=settings.ai_engine_timeout,
    )


def get_audio_storage():
    settings = get_settings()
    return LocalAudioStorage(root=settings.audio_storage_path)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

def get_orchestrator(
    consultation_repo=Depends(get_consultation_repo),
    report_repo=Depends(get_report_repo),
    ai_engine=Depends(get_ai_engine_client),
    audio_storage=Depends(get_audio_storage),
):
    return ConsultationOrchestrator(
        ai_engine=ai_engine,
        audio_storage=audio_storage,
        consultation_repo=consultation_repo,
        report_repo=report_repo,
    )


# ---------------------------------------------------------------------------
# Use case factories
# ---------------------------------------------------------------------------

def get_register_use_case(user_repo=Depends(get_user_repo)):
    return RegisterUserUseCase(user_repo=user_repo, hash_password=hash_password)


def get_login_use_case(user_repo=Depends(get_user_repo)):
    settings = get_settings()
    return LoginUseCase(
        user_repo=user_repo,
        verify_password=verify_password,
        create_token=lambda uid: create_access_token(
            user_id=uid,
            secret_key=settings.secret_key,
            algorithm=settings.algorithm,
            expire_minutes=settings.access_token_expire_minutes,
        ),
    )


def get_create_consultation_use_case(
    consultation_repo=Depends(get_consultation_repo),
    audio_storage=Depends(get_audio_storage),
    orchestrator=Depends(get_orchestrator),
):
    return CreateConsultationUseCase(
        consultation_repo=consultation_repo,
        audio_storage=audio_storage,
        orchestrator=orchestrator,
    )


def get_get_consultation_use_case(consultation_repo=Depends(get_consultation_repo)):
    return GetConsultationUseCase(consultation_repo=consultation_repo)


def get_list_consultations_use_case(consultation_repo=Depends(get_consultation_repo)):
    return ListConsultationsUseCase(consultation_repo=consultation_repo)


def get_get_report_use_case(
    consultation_repo=Depends(get_consultation_repo),
    report_repo=Depends(get_report_repo),
):
    return GetReportUseCase(
        consultation_repo=consultation_repo,
        report_repo=report_repo,
    )


# ---------------------------------------------------------------------------
# Auth guard
# ---------------------------------------------------------------------------

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UUID:
    settings = get_settings()
    try:
        user_id_str = decode_access_token(
            token=credentials.credentials,
            secret_key=settings.secret_key,
            algorithm=settings.algorithm,
        )
        return UUID(user_id_str)
    except (ValueError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
