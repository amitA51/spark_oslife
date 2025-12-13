/**
 * usePrevious Hook
 * 
 * Returns the previous value of a state or prop.
 * Useful for comparing values between renders.
 */

import { useRef, useEffect } from 'react';

/**
 * Hook that returns the previous value of the input
 * 
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 * // On first render: prevCount = undefined
 * // After setCount(5): prevCount = 0, count = 5
 */
export const usePrevious = <T>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
};

export default usePrevious;
