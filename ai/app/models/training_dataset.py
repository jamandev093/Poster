from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)


TrainingDatasetSchemaVersion = Literal[1]

TrainingSignalSource = Literal[
    "organic_content_event",
    "share",
    "report",
    "bookmark",
    "article_interaction",
    "article_feedback",
]

TrainingSignalType = Literal[
    "impression",
    "open_original_click",
    "share",
    "report",
    "bookmark",
    "worth_reading",
    "helpful",
    "article_feedback",
]

TrainingSurface = Literal[
    "home",
    "search",
    "trending",
    "bookmarks",
]

TrainingReportStatus = Literal[
    "pending",
    "triaged",
    "resolved",
    "dismissed",
]

TrainingContentStatus = Literal[
    "active",
    "hidden",
    "removed",
    "copyright_blocked",
]

NonEmptyText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
    ),
]

DatasetChecksum = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        pattern=r"^sha256:[0-9a-f]{64}$",
    ),
]

ReasonId = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        pattern=r"^[a-z0-9_-]{2,64}$",
    ),
]


class TrainingContentFeatures(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    contentId: NonEmptyText

    sourceKey: NonEmptyText | None = None

    publisherName: NonEmptyText | None = None

    title: NonEmptyText

    excerpt: str

    mediaType: NonEmptyText

    languageCode: NonEmptyText

    regionCode: NonEmptyText | None = None

    category: NonEmptyText | None = None

    canonicalTopicIds: list[str] = Field(
        default_factory=list,
    )

    evolvingTopicIds: list[str] = Field(
        default_factory=list,
    )

    tags: list[str] = Field(
        default_factory=list,
    )

    searchKeywords: list[str] = Field(
        default_factory=list,
    )

    aiClassification: dict[str, Any] = Field(
        default_factory=dict,
    )

    qualityScore: float

    publishedAt: datetime | None = None

    contentStatus: TrainingContentStatus


class TrainingDatasetEvent(BaseModel):
    """
    One normalized organic learning observation.

    Privacy boundary:
    - no user identifier
    - no report free-text details
    - no arbitrary event metadata
    - no commercial/ad interaction data
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    schemaVersion: TrainingDatasetSchemaVersion

    eventKey: NonEmptyText

    source: TrainingSignalSource

    sourceEventId: NonEmptyText

    signalType: TrainingSignalType

    occurredAt: datetime

    surface: TrainingSurface | None = None

    reasonId: ReasonId | None = None

    reportStatus: TrainingReportStatus | None = None

    bookmarkActive: bool | None = None

    content: TrainingContentFeatures


class TrainingDatasetManifest(BaseModel):
    """
    Immutable identity and counts for one Backend-materialized
    Poster Brain learning dataset snapshot.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    datasetId: NonEmptyText

    schemaVersion: TrainingDatasetSchemaVersion

    sourceEventCount: int = Field(
        ge=0,
    )

    materializedEventCount: int = Field(
        ge=10000,
    )

    materializedContentCount: int = Field(
        ge=1,
    )

    sourceCutoffAt: datetime

    firstEventAt: datetime

    lastEventAt: datetime

    datasetChecksum: DatasetChecksum

    @model_validator(
        mode="after",
    )
    def validate_event_range(
        self,
    ) -> "TrainingDatasetManifest":
        if (
            self.firstEventAt >
            self.lastEventAt
        ):
            raise ValueError(
                "firstEventAt cannot be after lastEventAt."
            )

        if (
            self.lastEventAt >
            self.sourceCutoffAt
        ):
            raise ValueError(
                "lastEventAt cannot be after sourceCutoffAt."
            )

        if (
            self.materializedEventCount >
            self.sourceEventCount
        ):
            raise ValueError(
                "materializedEventCount cannot exceed sourceEventCount."
            )

        return self


class TrainingDatasetPage(BaseModel):
    """
    One ordered page from a frozen Backend dataset snapshot.

    Pages are transport units only. Receiving a valid page does not
    claim that training has started or completed.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    datasetId: NonEmptyText

    schemaVersion: TrainingDatasetSchemaVersion

    pageNumber: int = Field(
        ge=1,
    )

    events: list[TrainingDatasetEvent]

    isFinalPage: bool

    @model_validator(
        mode="after",
    )
    def validate_page(
        self,
    ) -> "TrainingDatasetPage":
        if (
            not self.events
            and not self.isFinalPage
        ):
            raise ValueError(
                "A non-final training dataset page cannot be empty."
            )

        for event in self.events:
            if (
                event.schemaVersion !=
                self.schemaVersion
            ):
                raise ValueError(
                    "Training dataset event schemaVersion does not match the page."
                )

        return self


class TrainingDatasetHandoffRequest(BaseModel):
    """
    Initial Backend -> Python training handoff.

    The actual dataset is transported in bounded pages rather than
    requiring one unbounded JSON request.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    manifest: TrainingDatasetManifest