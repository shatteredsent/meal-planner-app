import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ProfileScreen from '../screens/ProfileScreen';

// ─── Dependency mocks ─────────────────────────────────────────────

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-uid', email: 'test@example.com' } }),
}));

const mockUpdateFamilyName = jest.fn();
jest.mock('../hooks/useFamily', () => ({
  useFamily: () => ({
    family: { name: 'Test Family' },
    isLoading: false,
    updateFamilyName: mockUpdateFamilyName,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));

// ProfileScreen reads the resolved familyId from the provider rather than
// assuming user.uid, so the shared family is what gets renamed.
jest.mock('../context/PlannerData', () => ({
  usePlannerData: () => ({ familyId: 'test-uid' }),
}));

jest.mock('../config/firebase', () => ({
  auth: {},
  db: {},
  functions: {},
}));

jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────

describe('ProfileScreen – Family Name modal', () => {
  it('opens when the Family Name row is tapped', () => {
    const { getByText, queryByPlaceholderText } = render(<ProfileScreen />);

    expect(queryByPlaceholderText('Enter family name')).toBeNull();
    fireEvent.press(getByText('Family Name'));
    expect(queryByPlaceholderText('Enter family name')).toBeTruthy();
  });

  it('pre-fills the input with the current family name', () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Family Name'));
    expect(getByPlaceholderText('Enter family name').props.value).toBe('Test Family');
  });

  it('TextInput does not have autoFocus', () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Family Name'));
    expect(getByPlaceholderText('Enter family name').props.autoFocus).toBeFalsy();
  });

  it('calls updateFamilyName with the new name and closes the modal', async () => {
    mockUpdateFamilyName.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Family Name'));
    fireEvent.changeText(getByPlaceholderText('Enter family name'), 'New Family Name');

    await act(async () => {
      fireEvent.press(getByText('Save'));
    });

    expect(mockUpdateFamilyName).toHaveBeenCalledWith('New Family Name');
    expect(queryByPlaceholderText('Enter family name')).toBeNull();
  });

  it('closes without saving when Cancel is tapped', () => {
    const { getByText, queryByPlaceholderText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Family Name'));
    fireEvent.press(getByText('Cancel'));

    expect(mockUpdateFamilyName).not.toHaveBeenCalled();
    expect(queryByPlaceholderText('Enter family name')).toBeNull();
  });
});
