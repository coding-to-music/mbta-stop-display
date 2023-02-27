import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import {
  Prediction,
  RouteAttributes,
  Schedule
} from 'types';
import {NextArrival} from 'NextArrival';
import {getRelevantTimes} from 'utils';

type NextArrivalsContainerProps = {
  predictionsData: Prediction[] | undefined;
  routeAttributes: RouteAttributes;
  scheduleData: Schedule[] | undefined;
}

export function NextArrivalsContainer ({
  predictionsData = [],
  routeAttributes,
  scheduleData = []
}: NextArrivalsContainerProps): JSX.Element {
  const [arrivalData, setArrivalData] =
    useState<Array<Prediction | Schedule>>([]);

  // Loading state here is needed for the period of time before the first
  // `updateNewArrivalData` interval kicks off.
  const [arrivalDataIsLoading, setArrivalDataIsLoading] =
    useState<boolean>(true);

  // Refresh the arrival data every x ms so that it always shows
  // information about the future, even if predictions have gotten
  // stale and haven't been refreshed yet.
  useEffect(() => {
    function updateNewArrivalData () {
      // Prediction data
      const relevantPredictionsData =
        getRelevantTimes(predictionsData || []);

      // Schedule data
      const relevantScheduleData =
        getRelevantTimes(scheduleData || []);

      // Assuming the schedule data will always have all possible
      // `direction_id` values
      const arrivalDataKeys: string[] = Object.keys(relevantScheduleData);

      setArrivalData(
        arrivalDataKeys.map((directionId) => (
          relevantPredictionsData[directionId] ||
          relevantScheduleData[directionId]
        ))
      );
      setArrivalDataIsLoading(false);
    }

    /*
    This will have the side effect of causing `NextArrival` components to re-render as well. This is desired here, since `NextArrival` contains presentation "countdowns" which we also want to re-evaluate at this same interval.
    */
    const newArrivalDataInterval =
      // Update display data every x ms to avoid passing down data
      // from more than x ms in the past
      setInterval(updateNewArrivalData, 1000);

    return () => clearInterval(newArrivalDataInterval);
  }, [predictionsData, scheduleData]);

  return !!arrivalData.length ? (
    <ArrivalsContainer>
      {/* Because we have the API return records sorted by
      `direction_id`, the order of these shouldn't change */}
      {arrivalData.map(arrival => (
        <NextArrival
          key={arrival.id}
          attributes={arrival.attributes}
          route={routeAttributes}
          type={arrival.type}
        />
      ))}
    </ArrivalsContainer>
  ) : (
    <ArrivalsContainer>
      {arrivalDataIsLoading ? (
        <div>Arrival information is loading...</div>
      ) : (
        <div>No arrival information for this stop was found.</div>
      )}
    </ArrivalsContainer>
  );
}

const ArrivalsContainer = styled.div`
  > div {
    margin: 20px auto;
  }
`;
