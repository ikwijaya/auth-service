-- This is an empty migration.
drop view if exists "UserGroupView";
create or replace view "UserGroupView"
as

select 	main.id,
		coalesce(_wait.id, coalesce(_appr.id, _rej.id)) as "revId",
		coalesce(_wait."groupId", coalesce(_appr."groupId", _rej."groupId")) as "groupId",
		coalesce(_wait."typeId", coalesce(_appr."typeId", _rej."typeId")) as "typeId",
		coalesce(_wait."makedBy", coalesce(_appr."makedBy", _rej."makedBy")) as "makedBy",
		coalesce(_wait."checkedBy", coalesce(_appr."checkedBy", _rej."checkedBy")) as "checkedBy",
		coalesce(_wait."makedAt", coalesce(_appr."makedAt", _rej."makedAt")) as "makedAt",
		coalesce(_wait."checkedAt", coalesce(_appr."checkedAt", _rej."checkedAt")) as "checkedAt",
		coalesce(_wait."actionCode", coalesce(_appr."actionCode", _rej."actionCode")) as "actionCode",
		coalesce(_wait."rowAction", coalesce(_appr."rowAction", _rej."rowAction")) as "rowAction",
		coalesce(_wait."sysAction", coalesce(_appr."sysAction", _rej."sysAction")) as "sysAction",
		coalesce(_wait."changelog", coalesce(_appr."changelog", _rej."changelog")) as "changelog",
		coalesce(_wait."isDefault", coalesce(_appr."isDefault", _rej."isDefault")) as "isDefault",
		coalesce(_wait."makedName", coalesce(_appr."makedName", _rej."makedName")) as "makedName",
		coalesce(_wait."checkedName", coalesce(_appr."checkedName", _rej."checkedName")) as "checkedName",
		coalesce(_wait."groupName", coalesce(_appr."groupName", _rej."groupName")) as "groupName",
		coalesce(_wait."typeName", coalesce(_appr."typeName", _rej."typeName")) as "typeName"

from 	"MainUserGroup" as main
-- approved
left join (
	select 	_base.id,
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
			coalesce(maked.username, maked.fullname) as "makedName",
			coalesce(checked.username, checked.fullname) as "checkedName",
			g."name" as "groupName",
			t."name" as "typeName"
	from 	"UserGroup" as _base
	left join "User" as maked on _base."makedBy" = maked.id
	left join "User" as checked on _base."checkedBy" = checked.id
	left join "Group" as g on _base."groupId" = g.id
	left join "Type" as t on _base."typeId" = t.id
	inner join (
		select 	a.id, MAX(a."checkedAt") as "checkedAt",
				MAX(a."makedAt") as "makedAt"
		from 	"UserGroup" as a
		where  	a."actionCode" = 'APPROVED'
		group by a.id
	) as _last	on _base.id = _last.id
				and _base."checkedAt" = _last."checkedAt"
				and _base."makedAt" = _last."makedAt"
) as _appr on main.id = _appr."mainId"

-- rejected
left join (
	select 	_base.id,
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
			coalesce(maked.username, maked.fullname) as "makedName",
			coalesce(checked.username, checked.fullname) as "checkedName",
			g."name" as "groupName",
			t."name" as "typeName"
	from 	"UserGroup" as _base
	left join "User" as maked on _base."makedBy" = maked.id
	left join "User" as checked on _base."checkedBy" = checked.id
	left join "Group" as g on _base."groupId" = g.id
	left join "Type" as t on _base."typeId" = t.id
	inner join (
		select 	a.id, MAX(a."checkedAt") as "checkedAt",
				MAX(a."makedAt") as "makedAt"
		from 	"UserGroup" as a
		where  	a."actionCode" = 'REJECTED'
		group by a.id
	) as _last	on _base.id = _last.id
				and _base."checkedAt" = _last."checkedAt"
				and _base."makedAt" = _last."makedAt"
) as _rej on main.id = _rej."mainId"

-- waiting
left join (
	select 	_base.id,
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
			coalesce(maked.username, maked.fullname) as "makedName",
			coalesce(checked.username, checked.fullname) as "checkedName",
			g."name" as "groupName",
			t."name" as "typeName"
	from 	"UserGroup" as _base
	left join "User" as maked on _base."makedBy" = maked.id
	left join "User" as checked on _base."checkedBy" = checked.id
	left join "Group" as g on _base."groupId" = g.id
	left join "Type" as t on _base."typeId" = t.id
	inner join (
		select 	a.id, MAX(a."makedAt") as "makedAt"
		from 	"UserGroup" as a
		where  	a."actionCode" = 'WAITING'
		group by a.id
	) as _last	on _base.id = _last.id and _base."makedAt" = _last."makedAt"
) as _wait on main.id = _wait."mainId"

