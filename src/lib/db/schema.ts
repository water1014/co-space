import Dexie, { type Table } from "dexie";
import type { Echo, Imprint, MemoryEntry } from "../../types";
import type {
  AlbumItemRecord,
  AlbumRecord,
  ChatMessageRecord,
  ChatSessionRecord,
  CompanionRecord,
  JournalRecord,
  MediaAssetRecord,
  MemoryLinkRecord,
  MigrationRecord,
  OwnerRecord,
  PersonaRevisionRecord,
  RelationshipMilestoneRecord,
  RelationshipRecord,
  SettingRecord,
} from "./records";

/**
 * Local-first database. Existing memory stores remain unchanged.
 * v3 only adds empty stores; it does not import, rewrite, or delete legacy data.
 */
export class CoSpaceDB extends Dexie {
  memories!: Table<MemoryEntry, string>;
  echoes!: Table<Echo, string>;
  imprints!: Table<Imprint, string>;

  owners!: Table<OwnerRecord, string>;
  companions!: Table<CompanionRecord, string>;
  personaRevisions!: Table<PersonaRevisionRecord, string>;
  relationships!: Table<RelationshipRecord, string>;
  relationshipMilestones!: Table<RelationshipMilestoneRecord, string>;
  chatSessions!: Table<ChatSessionRecord, string>;
  chatMessages!: Table<ChatMessageRecord, string>;
  memoryLinks!: Table<MemoryLinkRecord, string>;
  journals!: Table<JournalRecord, string>;
  mediaAssets!: Table<MediaAssetRecord, string>;
  albums!: Table<AlbumRecord, string>;
  albumItems!: Table<AlbumItemRecord, string>;
  migrations!: Table<MigrationRecord, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super("co-space::v1");

    this.version(1).stores({
      memories: "id, createdAt, updatedAt, source, weight, pinned, sealed",
    });

    // v2：记忆多了 kind / tags / resolved，并新增回声与印记两张表。
    this.version(2)
      .stores({
        memories:
          "id, createdAt, updatedAt, source, kind, weight, pinned, resolved",
        echoes: "id, at, hit",
        imprints: "id, at",
      })
      .upgrade((tx) =>
        tx
          .table("memories")
          .toCollection()
          .modify((m: Record<string, unknown>) => {
            m.kind ??= "fact";
            m.tags ??= [];
            m.resolved ??= false;
            delete m.sealed;
          }),
      );

    // v3：additive foundation. No legacy record transformation is performed.
    this.version(3).stores({
      memories: "id, createdAt, updatedAt, source, kind, weight, pinned, resolved",
      echoes: "id, at, hit",
      imprints: "id, at",
      owners: "id, updatedAt",
      companions: "id, updatedAt",
      personaRevisions: "id, companionId, version, updatedAt",
      relationships: "id, ownerId, companionId, status",
      relationshipMilestones: "id, relationshipId, happenedAt",
      chatSessions: "id, updatedAt, archivedAt",
      chatMessages: "id, sessionId, createdAt, [sessionId+createdAt]",
      memoryLinks: "id, memoryId, [targetType+targetId]",
      journals: "id, dateKey, updatedAt",
      mediaAssets: "id, createdAt, mimeType",
      albums: "id, createdAt",
      albumItems: "id, albumId, assetId, [albumId+sortOrder]",
      migrations: "id, migrationId, status, updatedAt",
      settings: "key, updatedAt",
    });
  }
}

export const db = new CoSpaceDB();
