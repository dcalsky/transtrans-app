import React, { forwardRef, PropsWithChildren, useCallback } from 'react';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
export type Ref = BottomSheetModal;


const defaultSnapPoints = ['35%', '55%', '75%', '90%'];

type BottomModalProps = {
  snapPoints?: string[];
  onChangeSnapPoint?: (index: number) => void;
  initSnapPoint?: number;
}

const BottomModal = forwardRef<Ref, PropsWithChildren<BottomModalProps>>((
  {
    initSnapPoint = 0,
    ...props
  },
  ref) => {

  const snapPoints = props.snapPoints || defaultSnapPoints;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      onChange={props.onChangeSnapPoint}
      snapPoints={snapPoints}
      index={initSnapPoint}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
    >
      <BottomSheetView className='px-2'>
        {props.children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});


export default BottomModal;