-- param {INT} $1:typeId(s)
SELECT  a."id"
FROM    "UserGroup" as a
INNER JOIN (
  SELECT  MAX(b."checkedAt") as "maxdate", b."userId", b."groupId"
  FROM    "UserGroup" as b
  WHERE   b."actionCode" = 'APPROVED' AND b."recordStatus" = 'A'
  GROUP BY b."userId", b."groupId"
) as ib ON a."userId" = ib."userId" AND a."groupId" = ib."groupId" AND a."checkedAt" = ib."maxdate"
WHERE   a."recordStatus" = 'A' AND a."actionCode" = 'APPROVED'
        AND a."typeId" = ANY($1);
