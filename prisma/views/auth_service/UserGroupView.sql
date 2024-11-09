SELECT
  main.id,
  COALESCE(_wait.id, COALESCE(_appr.id, _rej.id)) AS "revId",
  COALESCE(
    _wait."groupId",
    COALESCE(_appr."groupId", _rej."groupId")
  ) AS "groupId",
  COALESCE(
    _wait."typeId",
    COALESCE(_appr."typeId", _rej."typeId")
  ) AS "typeId",
  COALESCE(
    _wait."makedBy",
    COALESCE(_appr."makedBy", _rej."makedBy")
  ) AS "makedBy",
  COALESCE(
    _wait."checkedBy",
    COALESCE(_appr."checkedBy", _rej."checkedBy")
  ) AS "checkedBy",
  COALESCE(
    _wait."makedAt",
    COALESCE(_appr."makedAt", _rej."makedAt")
  ) AS "makedAt",
  COALESCE(
    _wait."checkedAt",
    COALESCE(_appr."checkedAt", _rej."checkedAt")
  ) AS "checkedAt",
  COALESCE(
    _wait."actionCode",
    COALESCE(_appr."actionCode", _rej."actionCode")
  ) AS "actionCode",
  COALESCE(
    _wait."rowAction",
    COALESCE(_appr."rowAction", _rej."rowAction")
  ) AS "rowAction",
  COALESCE(
    _wait."sysAction",
    COALESCE(_appr."sysAction", _rej."sysAction")
  ) AS "sysAction",
  COALESCE(
    _wait.changelog,
    COALESCE(_appr.changelog, _rej.changelog)
  ) AS changelog,
  COALESCE(
    _wait."isDefault",
    COALESCE(_appr."isDefault", _rej."isDefault")
  ) AS "isDefault",
  COALESCE(
    _wait."makedName",
    COALESCE(_appr."makedName", _rej."makedName")
  ) AS "makedName",
  COALESCE(
    _wait."checkedName",
    COALESCE(_appr."checkedName", _rej."checkedName")
  ) AS "checkedName",
  COALESCE(
    _wait."groupName",
    COALESCE(_appr."groupName", _rej."groupName")
  ) AS "groupName",
  COALESCE(
    _wait."typeName",
    COALESCE(_appr."typeName", _rej."typeName")
  ) AS "typeName"
FROM
  (
    (
      (
        "MainUserGroup" main
        LEFT JOIN (
          SELECT
            _base.id,
            _base."mainId",
            _base."groupId",
            _base."typeId",
            _base."makedBy",
            _base."checkedBy",
            _base."checkedAt",
            _base."makedAt",
            _base."actionCode",
            _base."rowAction",
            _base."sysAction",
            _base.changelog,
            _base."isDefault",
            COALESCE(maked.username, maked.fullname) AS "makedName",
            COALESCE(checked.username, checked.fullname) AS "checkedName",
            g.name AS "groupName",
            t.name AS "typeName"
          FROM
            (
              (
                (
                  (
                    (
                      "UserGroup" _base
                      LEFT JOIN "User" maked ON ((_base."makedBy" = maked.id))
                    )
                    LEFT JOIN "User" checked ON ((_base."checkedBy" = checked.id))
                  )
                  LEFT JOIN "Group" g ON ((_base."groupId" = g.id))
                )
                LEFT JOIN "Type" t ON ((_base."typeId" = t.id))
              )
              JOIN (
                SELECT
                  a.id,
                  max(a."checkedAt") AS "checkedAt",
                  max(a."makedAt") AS "makedAt"
                FROM
                  "UserGroup" a
                WHERE
                  (a."actionCode" = 'APPROVED' :: "actionCode")
                GROUP BY
                  a.id
              ) _last ON (
                (
                  (_base.id = _last.id)
                  AND (_base."checkedAt" = _last."checkedAt")
                  AND (_base."makedAt" = _last."makedAt")
                )
              )
            )
        ) _appr ON ((main.id = _appr."mainId"))
      )
      LEFT JOIN (
        SELECT
          _base.id,
          _base."mainId",
          _base."groupId",
          _base."typeId",
          _base."makedBy",
          _base."checkedBy",
          _base."checkedAt",
          _base."makedAt",
          _base."actionCode",
          _base."rowAction",
          _base."sysAction",
          _base.changelog,
          _base."isDefault",
          COALESCE(maked.username, maked.fullname) AS "makedName",
          COALESCE(checked.username, checked.fullname) AS "checkedName",
          g.name AS "groupName",
          t.name AS "typeName"
        FROM
          (
            (
              (
                (
                  (
                    "UserGroup" _base
                    LEFT JOIN "User" maked ON ((_base."makedBy" = maked.id))
                  )
                  LEFT JOIN "User" checked ON ((_base."checkedBy" = checked.id))
                )
                LEFT JOIN "Group" g ON ((_base."groupId" = g.id))
              )
              LEFT JOIN "Type" t ON ((_base."typeId" = t.id))
            )
            JOIN (
              SELECT
                a.id,
                max(a."checkedAt") AS "checkedAt",
                max(a."makedAt") AS "makedAt"
              FROM
                "UserGroup" a
              WHERE
                (a."actionCode" = 'REJECTED' :: "actionCode")
              GROUP BY
                a.id
            ) _last ON (
              (
                (_base.id = _last.id)
                AND (_base."checkedAt" = _last."checkedAt")
                AND (_base."makedAt" = _last."makedAt")
              )
            )
          )
      ) _rej ON ((main.id = _rej."mainId"))
    )
    LEFT JOIN (
      SELECT
        _base.id,
        _base."mainId",
        _base."groupId",
        _base."typeId",
        _base."makedBy",
        _base."checkedBy",
        _base."checkedAt",
        _base."makedAt",
        _base."actionCode",
        _base."rowAction",
        _base."sysAction",
        _base.changelog,
        _base."isDefault",
        COALESCE(maked.username, maked.fullname) AS "makedName",
        COALESCE(checked.username, checked.fullname) AS "checkedName",
        g.name AS "groupName",
        t.name AS "typeName"
      FROM
        (
          (
            (
              (
                (
                  "UserGroup" _base
                  LEFT JOIN "User" maked ON ((_base."makedBy" = maked.id))
                )
                LEFT JOIN "User" checked ON ((_base."checkedBy" = checked.id))
              )
              LEFT JOIN "Group" g ON ((_base."groupId" = g.id))
            )
            LEFT JOIN "Type" t ON ((_base."typeId" = t.id))
          )
          JOIN (
            SELECT
              a.id,
              max(a."makedAt") AS "makedAt"
            FROM
              "UserGroup" a
            WHERE
              (a."actionCode" = 'WAITING' :: "actionCode")
            GROUP BY
              a.id
          ) _last ON (
            (
              (_base.id = _last.id)
              AND (_base."makedAt" = _last."makedAt")
            )
          )
        )
    ) _wait ON ((main.id = _wait."mainId"))
  );