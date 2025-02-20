import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import flatMap from 'lodash.flatmap';
import {
  activityCodeToName,
  allActivities,
  allRoundActivities,
  rooms,
} from '../../../lib/activities';
import { formatToWeekDay, groupBy } from '../../../lib/utils';
import { useWCIF } from '../WCIFProvider';

export default function ScramblerSchedule() {
  const { wcif, setTitle } = useWCIF();

  useEffect(() => {
    setTitle('Scramblers');
  }, [setTitle]);

  const _rooms = rooms(wcif);

  const [roomSelector, setRoomSelector] = useState(_rooms[0].name);

  const _allRoundActivities = useMemo(
    () =>
      allRoundActivities(wcif)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .filter((activity) => activity.childActivities.length !== 0)
        .filter((activity) => activity.room?.name === roomSelector),
    [roomSelector, wcif]
  );
  const _allActivities = useMemo(() => allActivities(wcif), [wcif]);

  const getActivity = useCallback(
    (assignment) => _allActivities.find(({ id }) => id === assignment.activityId),
    [_allActivities]
  );

  const assignments = useMemo(
    () =>
      flatMap(wcif.persons, (person) =>
        person.assignments
          .filter((assignment) => assignment.assignmentCode === 'staff-scrambler')
          .map((assignment) => ({
            ...assignment,
            personName: person.name,
            activity: getActivity(assignment),
          }))
      ),
    [getActivity, wcif.persons]
  );

  const activitiesSplitAcrossDates = groupBy(
    _allRoundActivities.map((activity) => ({
      ...activity,
      date: formatToWeekDay(new Date(activity.startTime)) || '???',
    })),
    (x) => x.date
  );

  return (
    <div>
      <div className="print:hidden">
        <div className="flex items-center flex-col">
          <p className="text-xl">Rooms</p>
          <div className="flex flex-row w-full justify-evenly p-4">
            {_rooms.map((room) => (
              <div className="form-check" onClick={() => setRoomSelector(room.name)}>
                <input
                  className="form-check-input appearance-none rounded-full h-4 w-4 border border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2"
                  type="radio"
                  name={`room-selector-${room.name}`}
                  id={`room-selector-${room.name}`}
                  checked={roomSelector === room.name}
                />
                <label
                  className="form-check-label inline-block text-gray-800 cursor-pointer"
                  htmlFor={`room-selector-${room.name}`}>
                  {room.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden print:flex">Stage: {roomSelector}</div>
      <div className="shadow-md print:shadow-none">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="py-2 px-3 text-center w-60">Event</th>
              <th>Scramblers</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(activitiesSplitAcrossDates).map(([date, activities]) => (
              <>
                <tr key={date}>
                  <td colSpan={6} className="font-bold text-lg text-center py-2 px-3">
                    {date}
                  </td>
                </tr>
                {activities.map((activity) => (
                  <>
                    <tr key={activity.id}>
                      <td colSpan={2} className="py-2 px-3">
                        {activityCodeToName(activity.activityCode)}
                      </td>
                    </tr>
                    {activity.childActivities.map((childActivity) => (
                      <Link
                        key={childActivity.id}
                        to={`/competitions/${wcif.id}/activities/${childActivity.id}`}
                        className="table-row hover:bg-slate-100">
                        <td className="py-2 px-3">
                          {activityCodeToName(childActivity.activityCode).split(', ')[2]}
                        </td>
                        <td className="py-2 px-3">
                          {assignments
                            .filter((a) => a.activityId === childActivity.id)
                            .map(({ personName }) => personName)
                            .join(', ')}
                        </td>
                      </Link>
                    ))}
                  </>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
