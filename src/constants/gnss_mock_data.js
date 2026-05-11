const baseTimestamp = 1775207004;

const deviceProfiles = [
	{ code: 'TEST-DEVICE-001', lat: 37.4219983, lng: -122.084 },
	{ code: 'TEST-DEVICE-002', lat: 37.4225312, lng: -122.0864 },
	{ code: 'TEST-DEVICE-003', lat: 37.4231499, lng: -122.0818 },
	{ code: 'TEST-DEVICE-004', lat: 37.4207721, lng: -122.0829 },
	{ code: 'TEST-DEVICE-005', lat: 37.4199638, lng: -122.0883 }
];

const createStatus = (offset) => ([
	{ azimuthDegrees: 0, carrierFrequencyHz: 1599750016, cn0DbHz: 30 + (offset % 3), constellationType: 1, elevationDegrees: 0, svid: 3 + offset, hasAlmanacData: false, hasCarrierFrequencyHz: true, hasEphemerisData: false, usedInFix: false },
	{ azimuthDegrees: 15, carrierFrequencyHz: 1599750016, cn0DbHz: 31 + (offset % 2), constellationType: 1, elevationDegrees: 7, svid: 4 + offset, hasAlmanacData: false, hasCarrierFrequencyHz: true, hasEphemerisData: false, usedInFix: true },
	{ azimuthDegrees: 35, carrierFrequencyHz: 1599750016, cn0DbHz: 28 + (offset % 4), constellationType: 1, elevationDegrees: 11, svid: 5 + offset, hasAlmanacData: false, hasCarrierFrequencyHz: true, hasEphemerisData: false, usedInFix: true },
	{ azimuthDegrees: 57, carrierFrequencyHz: 1599750016, cn0DbHz: 29 + (offset % 4), constellationType: 1, elevationDegrees: 17, svid: 6 + offset, hasAlmanacData: false, hasCarrierFrequencyHz: true, hasEphemerisData: false, usedInFix: false },
	{ azimuthDegrees: 80, carrierFrequencyHz: 1599750016, cn0DbHz: 27 + (offset % 5), constellationType: 1, elevationDegrees: 25, svid: 7 + offset, hasAlmanacData: false, hasCarrierFrequencyHz: true, hasEphemerisData: false, usedInFix: true },
	{ azimuthDegrees: 102, carrierFrequencyHz: 1599750016, cn0DbHz: 30 + (offset % 3), constellationType: 1, elevationDegrees: 31, svid: 8 + offset, hasAlmanacData: false, hasCarrierFrequencyHz: true, hasEphemerisData: false, usedInFix: true }
]);

const createMeasurements = (offset) => ([
	{
		contents: 0,
		accumulatedDeltaRangeMeters: 6620.74237064615 + offset * 13.5,
		accumulatedDeltaRangeState: 17,
		accumulatedDeltaRangeUncertaintyMeters: 0.00271145859733223,
		automaticGainControlLevelDb: 0,
		carrierFrequencyHz: 1599750016,
		cn0DbHz: 29.99 + (offset % 3),
		constellationType: 1,
		multipathIndicator: 0,
		pseudorangeRateMetersPerSecond: 245.509362821673 + offset,
		pseudorangeRateUncertaintyMetersPerSecond: 0.148940800975766,
		receivedSvTimeNanos: 3927349114 + offset * 5,
		receivedSvTimeUncertaintyNanos: 29,
		snrInDb: 0,
		state: 47,
		svid: 22 + offset,
		timeOffsetNanos: 0,
		string: 'Mock GnssMeasurement A'
	},
	{
		contents: 0,
		accumulatedDeltaRangeMeters: -23229.096048105 + offset * 11.2,
		accumulatedDeltaRangeState: 17,
		accumulatedDeltaRangeUncertaintyMeters: 0.00142954161856323,
		automaticGainControlLevelDb: 0,
		carrierFrequencyHz: 1599750016,
		cn0DbHz: 36.06 - (offset % 2),
		constellationType: 1,
		multipathIndicator: 0,
		pseudorangeRateMetersPerSecond: -731.947951627658 + offset * 0.9,
		pseudorangeRateUncertaintyMetersPerSecond: 0.0769754027959242,
		receivedSvTimeNanos: 3920005435 + offset * 3,
		receivedSvTimeUncertaintyNanos: 14,
		snrInDb: 0,
		state: 47,
		svid: 23 + offset,
		timeOffsetNanos: 0,
		string: 'Mock GnssMeasurement B'
	},
	{
		contents: 0,
		accumulatedDeltaRangeMeters: -15511.1976492851 + offset * 7.6,
		accumulatedDeltaRangeState: 17,
		accumulatedDeltaRangeUncertaintyMeters: 0.00509250536561012,
		automaticGainControlLevelDb: 0,
		carrierFrequencyHz: 1599750016,
		cn0DbHz: 24.51 + (offset % 5),
		constellationType: 1,
		multipathIndicator: 0,
		pseudorangeRateMetersPerSecond: -329.789995021822 + offset * 0.6,
		pseudorangeRateUncertaintyMetersPerSecond: 0.277918601850871,
		receivedSvTimeNanos: 3923720994 + offset * 4,
		receivedSvTimeUncertaintyNanos: 56,
		snrInDb: 0,
		state: 47,
		svid: 25 + offset,
		timeOffsetNanos: 0,
		string: 'Mock GnssMeasurement C'
	}
]);

const createRaw = (offset) => ({
	status: createStatus(offset),
	measurements: createMeasurements(offset),
	clock: {
		contents: 0,
		biasNanos: 0,
		biasUncertaintyNanos: 0,
		driftNanosPerSecond: 0,
		driftUncertaintyNanosPerSecond: 0,
		fullBiasNanos: -1189181444165780000,
		hardwareClockDiscontinuityCount: offset % 3,
		leapSecond: -2147483648,
		timeNanos: 116834000000 + offset * 1000,
		timeUncertaintyNanos: 0
	}
});

export const satellites = Array.from({ length: 20 }, (_, index) => {
	const profile = deviceProfiles[index % deviceProfiles.length];
	const delta = index * 0.00018;

	return {
		deviceCode: profile.code,
		lat: Number((profile.lat + delta).toFixed(7)),
		lng: Number((profile.lng - delta).toFixed(7)),
		sp: index % 6,
		alt: 5 + (index % 4),
		hd: (index * 12) % 360,
		hdop: Number((0.7 + (index % 6) * 0.12).toFixed(2)),
		sat: 6 + (index % 5),
		rssi: -65 + (index % 8),
		ts: baseTimestamp + index * 60,
		acc: Number((3.5 + (index % 4) * 0.5).toFixed(1)),
		satUsed: 4 + (index % 5),
		avgCn0: 28 + (index % 7),
		raw: createRaw(index)
	};
});

export const gnssMockSatellites = satellites;

export const getGnssMockByDeviceCode = (deviceCode) => (
	satellites.filter((item) => item.deviceCode === deviceCode)
);

export const getGnssMockByTimestampRange = (fromTs, toTs) => (
	satellites.filter((item) => item.ts >= fromTs && item.ts <= toTs)
);

export const getLatestGnssMockByDeviceCode = (deviceCode) => {
	const list = getGnssMockByDeviceCode(deviceCode);
	if (!list.length) {
		return null;
	}

	return list.reduce((latest, current) => (current.ts > latest.ts ? current : latest));
};