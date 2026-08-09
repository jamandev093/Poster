from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)

from app.models.training_dataset import (
    DatasetChecksum,
    NonEmptyText,
    TrainingDatasetHandoffRequest,
    TrainingDatasetPage,
    TrainingDatasetSchemaVersion,
)


TRAINING_DATASET_HANDOFF_CONTENT_TYPE = (
    "application/x-ndjson"
)

MAX_TRAINING_DATASET_PAGE_EVENTS = 5000


class TrainingDatasetHandoffManifestLine(BaseModel):
    """
    First NDJSON line of a Backend -> Python dataset handoff.

    Exactly one manifest line starts the request stream.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    kind: Literal["manifest"] = "manifest"

    handoff: TrainingDatasetHandoffRequest


class TrainingDatasetHandoffPageLine(BaseModel):
    """
    One bounded dataset page in the NDJSON request stream.

    Page sequencing and full dataset integrity remain the
    responsibility of the locked training handoff validator.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    kind: Literal["page"] = "page"

    page: TrainingDatasetPage

    @model_validator(
        mode="after",
    )
    def validate_page_bound(
        self,
    ) -> "TrainingDatasetHandoffPageLine":
        if (
            len(
                self.page.events
            ) >
            MAX_TRAINING_DATASET_PAGE_EVENTS
        ):
            raise ValueError(
                "Training dataset HTTP page exceeds "
                f"{MAX_TRAINING_DATASET_PAGE_EVENTS} events."
            )

        return self


class TrainingDatasetHandoffValidationResponse(BaseModel):
    """
    Successful HTTP transport-validation result.

    'validated' means Python received and independently validated
    the frozen dataset. It does not mean model training started.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    status: Literal["validated"] = "validated"

    accepted: Literal[True] = True

    datasetId: NonEmptyText

    schemaVersion: TrainingDatasetSchemaVersion

    datasetChecksum: DatasetChecksum

    pageCount: int = Field(
        ge=1,
    )

    eventCount: int = Field(
        ge=10000,
    )

    contentCount: int = Field(
        ge=1,
    )

    sourceCutoffAt: datetime

    trainingStarted: Literal[False] = False