// app/src/components/GestureWrapper.js
import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3; // 30% of screen width

export function GestureWrapper({ children, onSwipeLeft, onSwipeRight }) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if horizontal swipe
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: 0,
        });
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow horizontal movement
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // Check if swipe threshold is met
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right
          handleSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left
          handleSwipe('left');
        } else {
          // Return to original position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleSwipe = (direction) => {
    // Animate out
    Animated.timing(pan, {
      toValue: {
        x: direction === 'left' ? -width : width,
        y: 0,
      },
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      // Call callback
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }

      // Reset position
      pan.setValue({ x: 0, y: 0 });
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});