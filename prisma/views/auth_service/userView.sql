SELECT
  us.id,
  COALESCE(
    iw.id,
    COALESCE(ia.id, COALESCE(ir.id, NULL :: integer))
  ) AS "revId",
  COALESCE(
    iw."groupId",
    COALESCE(
      ia."groupId",
      COALESCE(ir."groupId", us."groupId")
    )
  ) AS "groupId",
  COALESCE(
    iw."typeId",
    COALESCE(ia."typeId", COALESCE(ir."typeId", us."typeId"))
  ) AS "typeId",
  COALESCE(
    iw.username,
    COALESCE(ia.username, COALESCE(ir.username, us.username))
  ) AS username,
  COALESCE(
    iw.fullname,
    COALESCE(ia.fullname, COALESCE(ir.fullname, us.fullname))
  ) AS fullname,
  COALESCE(
    iw.email,
    COALESCE(ia.email, COALESCE(ir.email, us.email))
  ) AS email,
  COALESCE(iw.status, COALESCE(ia.status, ir.status)) AS STATUS,
  COALESCE(
    iw."recordStatus",
    COALESCE(
      ia."recordStatus",
      COALESCE(ir."recordStatus", us."recordStatus")
    )
  ) AS "recordStatus",
  COALESCE(
    iw."makedBy",
    COALESCE(ia."makedBy", ir."makedBy")
  ) AS "makedBy",
  COALESCE(
    iw."checkedBy",
    COALESCE(ia."checkedBy", ir."checkedBy")
  ) AS "checkedBy",
  COALESCE(
    iw."makedAt",
    COALESCE(ia."makedAt", ir."makedAt")
  ) AS "makedAt",
  COALESCE(
    iw."checkedAt",
    COALESCE(ia."checkedAt", ir."checkedAt")
  ) AS "checkedAt",
  COALESCE(
    iw."makedName",
    COALESCE(
      ia."makedName",
      COALESCE(ir."makedName", NULL :: text)
    )
  ) AS "makedName",
  COALESCE(
    iw."checkedName",
    COALESCE(
      ia."checkedName",
      COALESCE(ir."checkedName", NULL :: text)
    )
  ) AS "checkedName",
  COALESCE(
    iw."privilegeName",
    COALESCE(
      ia."privilegeName",
      COALESCE(ir."privilegeName", NULL :: text)
    )
  ) AS "typeName",
  COALESCE(
    iw."groupName",
    COALESCE(
      ia."groupName",
      COALESCE(ir."groupName", NULL :: text)
    )
  ) AS "groupName",
  COALESCE(
    iw."actionCode",
    COALESCE(
      ia."actionCode",
      COALESCE(ir."actionCode", us."actionCode")
    )
  ) AS "actionCode",
  COALESCE(
    iw."actionNote",
    COALESCE(
      ia."actionNote",
      COALESCE(ir."actionNote", us."actionNote")
    )
  ) AS "actionNote",
  COALESCE(
    iw."rowAction",
    COALESCE(
      ia."rowAction",
      COALESCE(ir."rowAction", us."rowAction")
    )
  ) AS "rowAction",
  COALESCE(
    iw."checkedEmail",
    COALESCE(
      ia."checkedEmail",
      COALESCE(ir."checkedEmail", NULL :: text)
    )
  ) AS "checkedEmail",
  COALESCE(
    iw."makedEmail",
    COALESCE(
      ia."makedEmail",
      COALESCE(ir."makedEmail", NULL :: text)
    )
  ) AS "makedEmail"
FROM
  (
    (
      (
        public."User" us
        LEFT JOIN (
          SELECT
            a.id,
            a."userId",
            a."typeId",
            a."groupId",
            a.email,
            a.username,
            a.fullname,
            a."makedAt",
            a."checkedAt",
            a."recordStatus",
            a."makedBy",
            a."checkedBy",
            COALESCE(um.fullname, um.username) AS "makedName",
            COALESCE(uc.fullname, uc.username) AS "checkedName",
            g.name AS "groupName",
            t.name AS "privilegeName",
            a."actionCode",
            a."actionNote",
            a."rowAction",
            um.email AS "makedEmail",
            uc.email AS "checkedEmail",
            'approved' :: text AS STATUS
          FROM
            (
              (
                (
                  (
                    (
                      public."UserRev" a
                      LEFT JOIN public."User" um ON ((a."makedBy" = um.id))
                    )
                    LEFT JOIN public."User" uc ON ((a."checkedBy" = uc.id))
                  )
                  LEFT JOIN public."Group" g ON ((a."groupId" = g.id))
                )
                LEFT JOIN public."Type" t ON ((a."typeId" = t.id))
              )
              JOIN (
                SELECT
                  ur."userId",
                  max(ur."checkedAt") AS "checkedAt",
                  max(ur."makedAt") AS "makedAt"
                FROM
                  public."UserRev" ur
                WHERE
                  (ur."actionCode" = 'A' :: text)
                GROUP BY
                  ur."userId"
              ) b ON (
                (
                  (a."userId" = b."userId")
                  AND (a."checkedAt" = b."checkedAt")
                  AND (a."makedAt" = b."makedAt")
                )
              )
            )
        ) ia ON ((ia."userId" = us.id))
      )
      LEFT JOIN (
        SELECT
          a.id,
          a."userId",
          a."typeId",
          a."groupId",
          a.email,
          a.username,
          a.fullname,
          a."makedAt",
          a."checkedAt",
          a."recordStatus",
          a."makedBy",
          a."checkedBy",
          COALESCE(um.fullname, um.username) AS "makedName",
          COALESCE(uc.fullname, uc.username) AS "checkedName",
          g.name AS "groupName",
          t.name AS "privilegeName",
          a."actionCode",
          a."actionNote",
          a."rowAction",
          um.email AS "makedEmail",
          uc.email AS "checkedEmail",
          'rejected' :: text AS STATUS
        FROM
          (
            (
              (
                (
                  (
                    public."UserRev" a
                    LEFT JOIN public."User" um ON ((a."makedBy" = um.id))
                  )
                  LEFT JOIN public."User" uc ON ((a."checkedBy" = uc.id))
                )
                LEFT JOIN public."Group" g ON ((a."groupId" = g.id))
              )
              LEFT JOIN public."Type" t ON ((a."typeId" = t.id))
            )
            JOIN (
              SELECT
                ur."userId",
                max(ur."checkedAt") AS "checkedAt",
                max(ur."makedAt") AS "makedAt"
              FROM
                public."UserRev" ur
              WHERE
                (ur."actionCode" = 'R' :: text)
              GROUP BY
                ur."userId"
            ) b ON (
              (
                (a."userId" = b."userId")
                AND (a."checkedAt" = b."checkedAt")
                AND (a."makedAt" = b."makedAt")
              )
            )
          )
      ) ir ON ((ir."userId" = us.id))
    )
    LEFT JOIN (
      SELECT
        a.id,
        a."userId",
        a."typeId",
        a."groupId",
        a.email,
        a.username,
        a.fullname,
        a."makedAt",
        a."checkedAt",
        a."recordStatus",
        a."makedBy",
        a."checkedBy",
        COALESCE(um.fullname, um.username) AS "makedName",
        COALESCE(uc.fullname, uc.username) AS "checkedName",
        g.name AS "groupName",
        t.name AS "privilegeName",
        a."actionCode",
        a."actionNote",
        a."rowAction",
        um.email AS "makedEmail",
        uc.email AS "checkedEmail",
        'waiting' :: text AS STATUS
      FROM
        (
          (
            (
              (
                (
                  public."UserRev" a
                  LEFT JOIN public."User" um ON ((a."makedBy" = um.id))
                )
                LEFT JOIN public."User" uc ON ((a."checkedBy" = uc.id))
              )
              LEFT JOIN public."Group" g ON ((a."groupId" = g.id))
            )
            LEFT JOIN public."Type" t ON ((a."typeId" = t.id))
          )
          JOIN (
            SELECT
              ur."userId",
              max(ur."makedAt") AS "makedAt"
            FROM
              public."UserRev" ur
            WHERE
              (ur."actionCode" = 'W' :: text)
            GROUP BY
              ur."userId"
          ) b ON (
            (
              (a."userId" = b."userId")
              AND (a."makedAt" = b."makedAt")
            )
          )
        )
    ) iw ON ((iw."userId" = us.id))
  );