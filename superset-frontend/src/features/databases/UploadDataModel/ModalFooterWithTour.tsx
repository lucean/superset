import { styled, t } from '@superset-ui/core';
import Button from 'src/components/Button';
import { Tour, TourProps } from 'antd-v5';
import { FC, useState } from 'react';
import { FormInstance } from 'antd/lib/form/hooks/useForm';
import Icons from '../../../components/Icons';

const StyledIcon = styled(Icons.Info)`
  &:first-of-type {
    margin: 0;
    display: flex;
    svg {
      margin: 0;
    }
  }
`;

const StyledTour = (props: React.ComponentProps<typeof Tour>) => (
  <Tour rootClassName="superset-tour-default" {...props} />
);

const ModalFooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const FooterGroup = styled.div`
  display: flex;
  align-items: center;
`;

type Props = {
  form: FormInstance;
  steps: TourProps['steps'];
  onClose: () => void;
  isLoading: boolean;
};

const ModalFooterWithTour: FC<Props> = ({
  form,
  steps,
  onClose,
  isLoading,
}) => {
  const [showTour, setShowTour] = useState<boolean>(false);

  return (
    <ModalFooterWrapper>
      <FooterGroup>
        <Button
          key="tour"
          buttonStyle="tertiary"
          onClick={() => setShowTour(true)}
          data-test="modal-tour-button"
        >
          <StyledIcon iconSize="m" />
          {t('Help')}
        </Button>
        {/* Tour is usually rendered via portal, so this is fine here */}
        <StyledTour
          open={showTour}
          onClose={() => setShowTour(false)}
          steps={steps}
        />
      </FooterGroup>

      <FooterGroup>
        <Button
          key="back"
          onClick={onClose}
          cta
          data-test="modal-cancel-button"
        >
          {t('Cancel')}
        </Button>
        <Button
          key="submit"
          buttonStyle="primary"
          disabled={false}
          loading={isLoading}
          onClick={form.submit}
          cta
          data-test="modal-confirm-button"
        >
          {t('Upload')}
        </Button>
      </FooterGroup>
    </ModalFooterWrapper>
  );
};

export default ModalFooterWithTour;
