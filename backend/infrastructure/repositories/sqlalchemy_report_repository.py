from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.domain.entities import Medication, MultilingualText, Report, SOAPReport
from backend.domain.errors import NotFoundError
from backend.domain.repositories import ReportRepository
from backend.infrastructure.db.models import ReportModel


class SqlAlchemyReportRepository(ReportRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, report: Report) -> Report:
        model = ReportModel(
            id=report.id,
            consultation_id=report.consultation_id,
            soap_json=report.soap.model_dump_json(),
            created_at=report.created_at,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _to_entity(model)

    async def get_by_consultation(self, consultation_id: UUID) -> Report:
        result = await self._session.execute(
            select(ReportModel).where(ReportModel.consultation_id == consultation_id)
        )
        model = result.scalar_one_or_none()
        if model is None:
            raise NotFoundError("Report", consultation_id)
        return _to_entity(model)


def _to_entity(model: ReportModel) -> Report:
    soap_data = json.loads(model.soap_json)
    soap = SOAPReport(
        subjective=MultilingualText(**soap_data["subjective"]),
        objective=MultilingualText(**soap_data["objective"]),
        assessment=MultilingualText(**soap_data["assessment"]),
        plan=MultilingualText(**soap_data["plan"]),
        icd10_codes=soap_data.get("icd10_codes", []),
        medications=[Medication(**m) for m in soap_data.get("medications", [])],
        severity=soap_data.get("severity", ""),
    )
    return Report(
        id=model.id,
        consultation_id=model.consultation_id,
        soap=soap,
        created_at=model.created_at,
    )
