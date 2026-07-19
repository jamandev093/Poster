"use client";

import { useMemo, useState } from "react";

import styles from "./UsersManager.module.css";

type UserStatus =
  | "active"
  | "suspended"
  | "disabled"
  | "deleted";

type StatusFilter =
  | "all"
  | UserStatus;

type UserAction =
  | "suspend"
  | "disable"
  | "restore"
  | "delete";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}

interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  status: UserStatus;
  joinedAt: string;
  lastActivity: string;
  interests: string[];
  bookmarksCount: number;
  interactionsCount: number;
  profileImage: boolean;
  emailVerified: boolean;
  audit: AuditEntry[];
}

const INITIAL_USERS: UserRecord[] = [
  {
    id: "USR-8250",
    name: "Aarav Sharma",
    username: "aarav.learns",
    email: "aarav@example.com",
    status: "active",
    joinedAt: "12 Jun 2026",
    lastActivity: "19 Jul 2026 · 12:42",
    interests: [
      "Artificial Intelligence",
      "Software Engineering",
      "Science",
      "Business",
    ],
    bookmarksCount: 26,
    interactionsCount: 84,
    profileImage: true,
    emailVerified: true,
    audit: [
      {
        id: "USR-8250-1",
        action: "Account created",
        actor: "System",
        timestamp: "12 Jun 2026 · 09:18",
      },
    ],
  },
  {
    id: "USR-8249",
    name: "Meera Kapoor",
    username: "meerak",
    email: "meera@example.com",
    status: "active",
    joinedAt: "10 Jun 2026",
    lastActivity: "19 Jul 2026 · 11:58",
    interests: [
      "Health",
      "Science",
      "Environment",
    ],
    bookmarksCount: 18,
    interactionsCount: 55,
    profileImage: false,
    emailVerified: true,
    audit: [
      {
        id: "USR-8249-1",
        action: "Account created",
        actor: "System",
        timestamp: "10 Jun 2026 · 16:04",
      },
    ],
  },
  {
    id: "USR-8248",
    name: "Rohan Desai",
    username: "rohanknowledge",
    email: "rohan@example.com",
    status: "suspended",
    joinedAt: "7 Jun 2026",
    lastActivity: "18 Jul 2026 · 20:17",
    interests: [
      "Technology",
      "Government",
      "Business",
    ],
    bookmarksCount: 9,
    interactionsCount: 31,
    profileImage: true,
    emailVerified: true,
    audit: [
      {
        id: "USR-8248-2",
        action: "Account suspended",
        actor: "Admin",
        timestamp: "19 Jul 2026 · 08:22",
        note: "Temporary account review.",
      },
      {
        id: "USR-8248-1",
        action: "Account created",
        actor: "System",
        timestamp: "7 Jun 2026 · 13:10",
      },
    ],
  },
  {
    id: "USR-8247",
    name: "Nisha Patel",
    username: "nisha.discovery",
    email: "nisha@example.com",
    status: "active",
    joinedAt: "5 Jun 2026",
    lastActivity: "19 Jul 2026 · 10:46",
    interests: [
      "Business",
      "Economics",
      "Technology",
      "Environment",
    ],
    bookmarksCount: 33,
    interactionsCount: 101,
    profileImage: true,
    emailVerified: true,
    audit: [
      {
        id: "USR-8247-1",
        action: "Account created",
        actor: "System",
        timestamp: "5 Jun 2026 · 11:21",
      },
    ],
  },
  {
    id: "USR-8246",
    name: "Kabir Malhotra",
    username: "kabir.m",
    email: "kabir@example.com",
    status: "disabled",
    joinedAt: "1 Jun 2026",
    lastActivity: "17 Jul 2026 · 17:32",
    interests: [
      "Sports",
      "Travel",
      "Technology",
    ],
    bookmarksCount: 5,
    interactionsCount: 22,
    profileImage: false,
    emailVerified: true,
    audit: [
      {
        id: "USR-8246-2",
        action: "Account disabled",
        actor: "Admin",
        timestamp: "18 Jul 2026 · 09:50",
        note: "Account access disabled pending review.",
      },
      {
        id: "USR-8246-1",
        action: "Account created",
        actor: "System",
        timestamp: "1 Jun 2026 · 14:44",
      },
    ],
  },
  {
    id: "USR-8245",
    name: "Ananya Rao",
    username: "ananyarao",
    email: "ananya@example.com",
    status: "deleted",
    joinedAt: "28 May 2026",
    lastActivity: "15 Jul 2026 · 12:08",
    interests: [
      "Science",
      "Humanities",
      "Society",
    ],
    bookmarksCount: 0,
    interactionsCount: 12,
    profileImage: false,
    emailVerified: true,
    audit: [
      {
        id: "USR-8245-2",
        action: "Account marked deleted",
        actor: "Admin",
        timestamp: "16 Jul 2026 · 10:12",
        note: "Mock frontend deletion state only.",
      },
      {
        id: "USR-8245-1",
        action: "Account created",
        actor: "System",
        timestamp: "28 May 2026 · 08:55",
      },
    ],
  },
];

function statusLabel(status: UserStatus): string {
  switch (status) {
    case "active":
      return "Active";

    case "suspended":
      return "Suspended";

    case "disabled":
      return "Disabled";

    case "deleted":
      return "Deleted";
  }
}

function nowLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UsersManager() {
  const [users, setUsers] =
    useState<UserRecord[]>(INITIAL_USERS);

  const [query, setQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);

  const [pendingAction, setPendingAction] =
    useState<UserAction | null>(null);

  const [actionReason, setActionReason] =
    useState("");

  const normalizedQuery =
    query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesStatus =
        statusFilter === "all" ||
        user.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        user.id,
        user.name,
        user.username,
        user.email,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [
    normalizedQuery,
    statusFilter,
    users,
  ]);

  const selectedUser = useMemo(
    () =>
      users.find(
        (user) =>
          user.id === selectedUserId
      ) ?? null,
    [selectedUserId, users]
  );

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter(
        (user) =>
          user.status === "active"
      ).length,
      suspended: users.filter(
        (user) =>
          user.status === "suspended"
      ).length,
      disabled: users.filter(
        (user) =>
          user.status === "disabled"
      ).length,
      deleted: users.filter(
        (user) =>
          user.status === "deleted"
      ).length,
    }),
    [users]
  );

  const openUser = (
    userId: string
  ) => {
    setSelectedUserId(userId);
    setPendingAction(null);
    setActionReason("");
  };

  const closeDrawer = () => {
    setSelectedUserId(null);
    setPendingAction(null);
    setActionReason("");
  };

  const beginAction = (
    action: UserAction
  ) => {
    setPendingAction(action);
    setActionReason("");
  };

  const cancelAction = () => {
    setPendingAction(null);
    setActionReason("");
  };

  const executeAction = () => {
    if (
      !selectedUser ||
      !pendingAction
    ) {
      return;
    }

    const nextStatus: UserStatus =
      pendingAction === "suspend"
        ? "suspended"
        : pendingAction === "disable"
        ? "disabled"
        : pendingAction === "restore"
        ? "active"
        : "deleted";

    const actionLabel =
      pendingAction === "suspend"
        ? "Account suspended"
        : pendingAction === "disable"
        ? "Account disabled"
        : pendingAction === "restore"
        ? "Account restored"
        : "Account marked deleted";

    const reason =
      actionReason.trim();

    setUsers((current) =>
      current.map((user) => {
        if (
          user.id !==
          selectedUser.id
        ) {
          return user;
        }

        return {
          ...user,
          status: nextStatus,
          audit: [
            {
              id:
                `${user.id}-${Date.now()}`,
              action: actionLabel,
              actor: "Admin",
              timestamp: nowLabel(),
              note:
                reason ||
                undefined,
            },
            ...user.audit,
          ],
        };
      })
    );

    setPendingAction(null);
    setActionReason("");
  };

  const actionTitle =
    pendingAction === "suspend"
      ? "Suspend this account?"
      : pendingAction === "disable"
      ? "Disable this account?"
      : pendingAction === "restore"
      ? "Restore this account?"
      : "Delete this account?";

  const actionDescription =
    pendingAction === "suspend"
      ? "Suspension temporarily blocks account access until an operator restores the account."
      : pendingAction === "disable"
      ? "Disabling blocks account access. Use this only when account access should remain unavailable until explicitly restored."
      : pendingAction === "restore"
      ? "Restoring returns the account to Active status in this Admin interface."
      : "This mock Admin marks the account as deleted locally. Real deletion, retention, security checks, session revocation, and database cleanup will be implemented in the backend.";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            Account operations
          </div>

          <h2>Users</h2>

          <p>
            Find accounts and perform only
            essential account actions. Poster
            does not need CRM, messaging,
            marketing automation, or a complex
            user-management suite.
          </p>
        </div>

        <div className={styles.summary}>
          <strong>
            {counts.active.toLocaleString()}
          </strong>

          <span>active accounts</span>
        </div>
      </header>

      <section className={styles.notice}>
        <div className={styles.noticeMark}>
          i
        </div>

        <div>
          <strong>
            Current actions are frontend-only.
          </strong>

          <p>
            Account status changes reset when
            this page reloads. Backend
            authentication, session revocation,
            persistence, deletion rules, and
            immutable audit logging are still
            pending.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <label
            className={styles.searchBox}
          >
            <span>Search users</span>

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Name, email, username, or user ID"
            />
          </label>

          <div
            className={styles.resultCount}
          >
            <strong>
              {filteredUsers.length}
            </strong>

            <span>
              {filteredUsers.length === 1
                ? "account"
                : "accounts"}
            </span>
          </div>
        </div>

        <div className={styles.filters}>
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              [
                "suspended",
                "Suspended",
              ],
              [
                "disabled",
                "Disabled",
              ],
              ["deleted", "Deleted"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                statusFilter === key
                  ? styles.filterActive
                  : styles.filter
              }
              onClick={() =>
                setStatusFilter(key)
              }
            >
              {label}

              <span>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.tableWrap}>
          <table
            className={styles.table}
          >
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Joined</th>
                <th>
                  Last activity
                </th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map(
                (user) => (
                  <tr key={user.id}>
                    <td>
                      <button
                        type="button"
                        className={
                          styles.userButton
                        }
                        onClick={() =>
                          openUser(
                            user.id
                          )
                        }
                      >
                        <span
                          className={
                            styles.avatar
                          }
                        >
                          {initials(
                            user.name
                          )}
                        </span>

                        <span
                          className={
                            styles.userIdentity
                          }
                        >
                          <strong>
                            {user.name}
                          </strong>

                          <span>
                            @
                            {
                              user.username
                            }
                          </span>

                          <span>
                            {user.email}
                          </span>
                        </span>
                      </button>
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          user.status ===
                          "active"
                            ? styles.statusActive
                            : user.status ===
                              "suspended"
                            ? styles.statusSuspended
                            : user.status ===
                              "disabled"
                            ? styles.statusDisabled
                            : styles.statusDeleted
                        }`}
                      >
                        {statusLabel(
                          user.status
                        )}
                      </span>
                    </td>

                    <td>
                      {user.joinedAt}
                    </td>

                    <td>
                      {
                        user.lastActivity
                      }
                    </td>

                    <td>
                      <button
                        type="button"
                        className={
                          styles.viewButton
                        }
                        onClick={() =>
                          openUser(
                            user.id
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {filteredUsers.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              <strong>
                No matching users
              </strong>

              <span>
                Try another search
                or status filter.
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {selectedUser ? (
        <div
          className={
            styles.drawerLayer
          }
        >
          <button
            type="button"
            className={
              styles.backdrop
            }
            aria-label="Close user details"
            onClick={closeDrawer}
          />

          <aside
            className={
              styles.drawer
            }
            aria-label={`User ${selectedUser.id}`}
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div
                className={
                  styles.drawerIdentity
                }
              >
                <span
                  className={
                    styles.largeAvatar
                  }
                >
                  {initials(
                    selectedUser.name
                  )}
                </span>

                <div>
                  <span
                    className={
                      styles.userId
                    }
                  >
                    {
                      selectedUser.id
                    }
                  </span>

                  <h3>
                    {
                      selectedUser.name
                    }
                  </h3>

                  <p>
                    @
                    {
                      selectedUser.username
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Close"
                onClick={closeDrawer}
              >
                ×
              </button>
            </div>

            <div
              className={
                styles.drawerBody
              }
            >
              <section
                className={
                  styles.detailSection
                }
              >
                <div
                  className={
                    styles.sectionTitleRow
                  }
                >
                  <h4>
                    Account
                  </h4>

                  <span
                    className={`${styles.status} ${
                      selectedUser.status ===
                      "active"
                        ? styles.statusActive
                        : selectedUser.status ===
                          "suspended"
                        ? styles.statusSuspended
                        : selectedUser.status ===
                          "disabled"
                        ? styles.statusDisabled
                        : styles.statusDeleted
                    }`}
                  >
                    {statusLabel(
                      selectedUser.status
                    )}
                  </span>
                </div>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>Email</dt>

                    <dd>
                      {
                        selectedUser.email
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Username
                    </dt>

                    <dd>
                      @
                      {
                        selectedUser.username
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Email verified
                    </dt>

                    <dd>
                      {selectedUser.emailVerified
                        ? "Yes"
                        : "No"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Joined
                    </dt>

                    <dd>
                      {
                        selectedUser.joinedAt
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Last activity
                    </dt>

                    <dd>
                      {
                        selectedUser.lastActivity
                      }
                    </dd>
                  </div>
                </dl>
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Profile summary
                </h4>

                <div
                  className={
                    styles.metrics
                  }
                >
                  <div>
                    <span>
                      Interests
                    </span>

                    <strong>
                      {
                        selectedUser
                          .interests
                          .length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bookmarks
                    </span>

                    <strong>
                      {
                        selectedUser
                          .bookmarksCount
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Interactions
                    </span>

                    <strong>
                      {
                        selectedUser
                          .interactionsCount
                      }
                    </strong>
                  </div>
                </div>

                <div
                  className={
                    styles.interests
                  }
                >
                  {selectedUser.interests.map(
                    (interest) => (
                      <span
                        key={interest}
                      >
                        {interest}
                      </span>
                    )
                  )}
                </div>
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Audit history
                </h4>

                <div
                  className={
                    styles.auditList
                  }
                >
                  {selectedUser.audit.map(
                    (entry) => (
                      <div
                        key={
                          entry.id
                        }
                        className={
                          styles.auditItem
                        }
                      >
                        <span
                          className={
                            styles.auditDot
                          }
                        />

                        <div>
                          <strong>
                            {
                              entry.action
                            }
                          </strong>

                          <span>
                            {
                              entry.actor
                            }{" "}
                            ·{" "}
                            {
                              entry.timestamp
                            }
                          </span>

                          {entry.note ? (
                            <p>
                              {
                                entry.note
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>

            <div
              className={
                styles.drawerFooter
              }
            >
              {selectedUser.status ===
              "active" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      beginAction(
                        "suspend"
                      )
                    }
                  >
                    Suspend
                  </button>

                  <button
                    type="button"
                    className={
                      styles.warningButton
                    }
                    onClick={() =>
                      beginAction(
                        "disable"
                      )
                    }
                  >
                    Disable
                  </button>

                  <button
                    type="button"
                    className={
                      styles.dangerButton
                    }
                    onClick={() =>
                      beginAction(
                        "delete"
                      )
                    }
                  >
                    Delete account
                  </button>
                </>
              ) : selectedUser.status ===
                "suspended" ||
                selectedUser.status ===
                  "disabled" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() =>
                      beginAction(
                        "restore"
                      )
                    }
                  >
                    Restore account
                  </button>

                  <button
                    type="button"
                    className={
                      styles.dangerButton
                    }
                    onClick={() =>
                      beginAction(
                        "delete"
                      )
                    }
                  >
                    Delete account
                  </button>
                </>
              ) : (
                <span
                  className={
                    styles.deletedNote
                  }
                >
                  This account is
                  marked deleted in
                  the current mock
                  state.
                </span>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedUser &&
      pendingAction ? (
        <div
          className={
            styles.confirmLayer
          }
        >
          <button
            type="button"
            className={
              styles.confirmBackdrop
            }
            aria-label="Cancel account action"
            onClick={cancelAction}
          />

          <div
            className={
              styles.confirmDialog
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-action-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Account action
            </span>

            <h3
              id="user-action-title"
            >
              {actionTitle}
            </h3>

            <div
              className={
                styles.confirmUser
              }
            >
              <strong>
                {selectedUser.name}
              </strong>

              <span>
                @
                {
                  selectedUser.username
                }{" "}
                ·{" "}
                {
                  selectedUser.id
                }
              </span>
            </div>

            <p>
              {actionDescription}
            </p>

            <label
              className={
                styles.reasonField
              }
            >
              <span>
                Internal reason
                <small>
                  optional
                </small>
              </span>

              <textarea
                value={actionReason}
                onChange={(event) =>
                  setActionReason(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Add a short reason for the audit history."
              />
            </label>

            {pendingAction ===
            "delete" ? (
              <div
                className={
                  styles.dangerNotice
                }
              >
                Real account deletion
                is not implemented
                yet. This action only
                changes local frontend
                state and resets on
                refresh.
              </div>
            ) : null}

            <div
              className={
                styles.confirmActions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={cancelAction}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  pendingAction ===
                  "delete"
                    ? styles.dangerButton
                    : pendingAction ===
                      "disable"
                    ? styles.warningButton
                    : styles.primaryButton
                }
                onClick={executeAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}