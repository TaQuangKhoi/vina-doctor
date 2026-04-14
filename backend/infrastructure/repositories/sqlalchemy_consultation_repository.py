from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.domain.entities import Consultation
from backend.domain.errors import NotFoundError
from backend.domain.repositories import ConsultationRepository
from backend.domain.value_objects import ConsultationStatus
from backend.infrastructure.db.models import ConsultationModel


class SqlAlchemyConsultationRepository(ConsultationRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, consultation: Consultation) -> Consultation:
        model = ConsultationModel(
            id=consultation.id,
            doctor_id=consultation.doctor_id,
            audio_path=consultation.audio_path,
            status=consultation.status,
            created_at=consultation.created_at,
            updated_at=consultation.updated_at,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _to_entity(model)

    async def get_by_id(self, consultation_id: UUID) -> Consultation:
        model = await self._session.get(ConsultationModel, consultation_id)
        if model is None:
            raise NotFoundError("Consultation", consultation_id)
        return _to_entity(model)

    async def list_by_doctor(
        self,
        doctor_id: UUID,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Consultation]:
        result = await self._session.execute(
            select(ConsultationModel)
            .where(ConsultationModel.doctor_id == doctor_id)
            .order_by(ConsultationModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [_to_entity(row) for row in result.scalars().all()]

    async def update_status(
        self,
        consultation_id: UUID,
        status: ConsultationStatus,
    ) -> Consultation:
        model = await self._session.get(ConsultationModel, consultation_id)
        if model is None:
            raise NotFoundError("Consultation", consultation_id)
        model.status = status
        model.updated_at = datetime.utcnow()
        await self._session.commit()
        await self._session.refresh(model)
        return _to_entity(model)


def _to_entity(model: ConsultationModel) -> Consultation:
    return Consultation(
        id=model.id,
        doctor_id=model.doctor_id,
        audio_path=model.audio_path,
        status=ConsultationStatus(model.status),
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
