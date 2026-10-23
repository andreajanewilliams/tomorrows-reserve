import copy
import unittest
import hydraulics as h


class HydraulicAccounting(unittest.TestCase):
    def test_energy_units_and_terminal_endpoint(self):
        # One kW for a complete day is 24 kWh; terminal power earns no interval.
        values = h.integrate_hourly([0, 1800, 86400], [1000, 1000, 99999999])
        self.assertEqual(values, [1.0]*24)

    def test_incomplete_trace_is_refused(self):
        with self.assertRaises(ValueError):
            h.integrate_hourly([0, 3600], [1000, 1000])

    def test_each_tank_must_restore_its_own_water(self):
        base = {'minPressureM': 25, 'unmetM3': 0, 'initialTankM3': {'a': 10, 'b': 10},
                'finalTankM3': {'a': 10, 'b': 10}}
        other = copy.deepcopy(base)
        other['finalTankM3'] = {'a': 9, 'b': 11}
        self.assertIn('TANK_a_DEFICIT', h.hydraulic_failures(other, base))

    def test_initial_storage_cannot_be_hidden_by_depleted_comparator(self):
        base = {'minPressureM': 25, 'unmetM3': 0, 'initialTankM3': {'a': 10}, 'finalTankM3': {'a': 8}}
        other = copy.deepcopy(base)
        other['finalTankM3']['a'] = 9
        self.assertIn('TANK_a_DEFICIT', h.hydraulic_failures(other, base))

    def test_baseline_service_failure_disqualifies_comparison(self):
        base = {'minPressureM': 19, 'unmetM3': 1, 'initialTankM3': {'a': 10}, 'finalTankM3': {'a': 10}}
        self.assertIn('BASELINE_PRESSURE', h.hydraulic_failures(base, base))
        self.assertIn('BASELINE_UNMET_DEMAND', h.hydraulic_failures(base, base))

    def test_missing_carbon_is_not_filled_with_zero(self):
        self.assertIsNone(h.carbon_day({}, '2020-02-05'))

    def test_bill_protection_and_carbon_priority_are_distinct(self):
        base = {'minPressureM': 25, 'unmetM3': 0, 'initialTankM3': {'a': 10},
                'finalTankM3': {'a': 10}, 'hourlyKWh': [0.0]*24}
        base['hourlyKWh'][0] = 10
        other = copy.deepcopy(base)
        other['hourlyKWh'][0] = 0
        other['hourlyKWh'][18] = 9
        signal = [500]*24
        signal[18] = 100
        carbon = h.assess(other, base, signal)
        budget = h.assess(other, base, signal, bill_protected=True)
        self.assertTrue(carbon['eligible'])
        self.assertTrue(carbon['billIncreases'])
        self.assertFalse(budget['eligible'])
        self.assertIn('SCENARIO_COST_INCREASE', budget['failures'])

    def test_replay_rejects_changed_verdict_and_nonfinite_numbers(self):
        with self.assertRaises(ValueError):
            h.compare({'eligible': False}, {'eligible': True})
        with self.assertRaises(ValueError):
            h.compare({'value': 5.0}, {'value': float('nan')})


if __name__ == '__main__':
    unittest.main()
