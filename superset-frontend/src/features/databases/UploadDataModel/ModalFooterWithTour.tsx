import { FC, ReactNode } from 'react';
import { styled, t } from '@superset-ui/core';
import { Button } from 'src/components';
import Icons from 'src/components/Icons';

type Props = {
  onCancel: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  isSubmitDisabled?: boolean;
  onHelpClick: () => void;
  TourElement: ReactNode;
};

const StyledIcon = styled(Icons.Info)`
  &:first-of-type {
    margin: 0;
    display: flex;
    svg {
      margin: 0;
    }
  }
`;

const FooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const FooterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.gridUnit * 2}px;
`;

const ModalFooterWithTour: FC<Props> = ({
  onCancel,
  onSubmit,
  isLoading,
  isSubmitDisabled = false,
  onHelpClick,
  TourElement,
}) => (
  <FooterWrapper>
    <FooterGroup>
      <Button
        key="tour"
        buttonStyle="tertiary"
        onClick={onHelpClick}
        data-test="modal-tour-button"
      >
        <StyledIcon iconSize="m" />
        {t('Help')}
      </Button>
      {/* Tour is rendered via portal, so just including the element here is fine */}
      {TourElement}
    </FooterGroup>

    <FooterGroup>
      <Button key="back" onClick={onCancel} cta data-test="modal-cancel-button">
        {t('Cancel')}
      </Button>
      <Button
        key="submit"
        buttonStyle="primary"
        disabled={isSubmitDisabled}
        loading={isLoading}
        onClick={onSubmit}
        cta
        data-test="modal-confirm-button"
      >
        {t('Upload')}
      </Button>
    </FooterGroup>
  </FooterWrapper>
);

export default ModalFooterWithTour;
