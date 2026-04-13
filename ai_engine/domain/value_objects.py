from enum import Enum


class SeverityFlag(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Language(str, Enum):
    EN = "en"
    VN = "vn"
    FR = "fr"
    AR = "ar"
