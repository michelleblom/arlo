/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react'
import { Formik, FormikProps, Form, Field, ErrorMessage } from 'formik'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { HTMLSelect, Spinner, FileInput } from '@blueprintjs/core'
import { IAudit, IErrorResponse } from '../../../../types'
import FormWrapper from '../../../Form/FormWrapper'
import FormButtonBar from '../../../Form/FormButtonBar'
import FormButton from '../../../Form/FormButton'
import { IValues } from './types'
import labelValueStates from './states'
import schema from './schema'
import { ErrorLabel } from '../../../Form/_helpers'
import FormSection, { FormSectionDescription } from '../../../Form/FormSection'
import { api, checkAndToast } from '../../../utilities'
import { ISidebarMenuItem } from '../../../Atoms/Sidebar'
import useAuditSettings from '../useAuditSettings'

export const Select = styled(HTMLSelect)`
  margin-top: 5px;
`

interface IProps {
  audit: IAudit
  nextStage: ISidebarMenuItem
}

const Participants: React.FC<IProps> = ({ audit, nextStage }: IProps) => {
  const { electionId } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [{ state }, updateSettings] = useAuditSettings(electionId!)
  const submit = async (values: IValues) => {
    try {
      setIsLoading(true)
      const responseOne = await updateSettings({ state: values.state })
      if (!responseOne) return
      /* istanbul ignore else */
      if (values.csv) {
        const formData: FormData = new FormData()
        formData.append('jurisdictions', values.csv, values.csv.name)
        const errorResponse: IErrorResponse = await api(
          `/election/${electionId}/jurisdiction/file`,
          {
            method: 'PUT',
            body: formData,
          }
        )
        if (checkAndToast(errorResponse)) return
      }
      nextStage.activate()
    } catch (err) {
      toast.error(err.message)
    }
  }
  return (
    <Formik
      initialValues={{ state: state || '', csv: null }}
      validationSchema={schema}
      onSubmit={submit}
      enableReinitialize
    >
      {({
        handleSubmit,
        setFieldValue,
        values,
        touched,
        errors,
        handleBlur,
      }: FormikProps<IValues>) => (
        <Form data-testid="form-one">
          <FormWrapper title="Participants">
            <label htmlFor="state">
              Choose your state from the options below
              <br />
              <Field
                component={Select}
                id="state"
                data-testid="state-field"
                name="state"
                onChange={(e: React.FormEvent<HTMLSelectElement>) =>
                  setFieldValue('state', e.currentTarget.value)
                }
                disabled={!!audit.frozenAt}
                value={values.state || ''}
                options={[{ value: '' }, ...labelValueStates]}
              />
            </label>
            <ErrorMessage name="state" component={ErrorLabel} />
            {/* When one is already uploaded, this will be toggled to show its details, with a button to reveal the form to replace it */}
            <FormSection>
              <FormSectionDescription>
                Click &quot;Browse&quot; to choose the appropriate file from
                your computer. This file should be a comma-separated list of all
                the jurisdictions participating in the audit, plus email
                addresses for audit administrators in each participating
                jurisdiction.
                <br />
                <br />
                <a
                  href={`${window.location.origin}/sample_jurisdiction_filesheet.csv`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (Click here to view a sample file in the correct format.)
                </a>
              </FormSectionDescription>
            </FormSection>
            <FormSection>
              <FileInput
                inputProps={{
                  accept: '.csv',
                  name: 'csv',
                }}
                onInputChange={e => {
                  setFieldValue(
                    'csv',
                    (e.currentTarget.files && e.currentTarget.files[0]) ||
                      undefined
                  )
                }}
                hasSelection={!!values.csv}
                text={values.csv ? values.csv.name : 'Select a CSV...'}
                onBlur={handleBlur}
              />
              {errors.csv && touched.csv && (
                <ErrorLabel>{errors.csv}</ErrorLabel>
              )}
            </FormSection>
          </FormWrapper>
          {isLoading && <Spinner />}
          {!isLoading && (
            <FormButtonBar>
              <FormButton
                type="submit"
                intent="primary"
                disabled={!!audit.frozenAt}
                onClick={e => {
                  handleSubmit(e)
                }}
              >
                Save &amp; Next
              </FormButton>
            </FormButtonBar>
          )}
        </Form>
      )}
    </Formik>
  )
}

export default Participants
