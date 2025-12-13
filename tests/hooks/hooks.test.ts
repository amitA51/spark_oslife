/**
 * Hook Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '../../hooks/useToggle';
import { usePrevious } from '../../hooks/usePrevious';

describe('useToggle', () => {
    it('should initialize with false by default', () => {
        const { result } = renderHook(() => useToggle());
        expect(result.current[0]).toBe(false);
    });

    it('should initialize with provided value', () => {
        const { result } = renderHook(() => useToggle(true));
        expect(result.current[0]).toBe(true);
    });

    it('should toggle value when toggle is called', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current[1](); // toggle
        });

        expect(result.current[0]).toBe(true);

        act(() => {
            result.current[1](); // toggle again
        });

        expect(result.current[0]).toBe(false);
    });

    it('should set value directly when set is called', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current[2](true); // set to true
        });

        expect(result.current[0]).toBe(true);

        act(() => {
            result.current[2](false); // set to false
        });

        expect(result.current[0]).toBe(false);
    });
});

describe('usePrevious', () => {
    it('should return undefined on first render', () => {
        const { result } = renderHook(() => usePrevious(0));
        expect(result.current).toBe(undefined);
    });

    it('should return previous value after update', () => {
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: 0 } }
        );

        expect(result.current).toBe(undefined);

        rerender({ value: 1 });
        expect(result.current).toBe(0);

        rerender({ value: 2 });
        expect(result.current).toBe(1);
    });

    it('should work with objects', () => {
        const obj1 = { name: 'first' };
        const obj2 = { name: 'second' };

        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: obj1 } }
        );

        expect(result.current).toBe(undefined);

        rerender({ value: obj2 });
        expect(result.current).toBe(obj1);
    });
});
