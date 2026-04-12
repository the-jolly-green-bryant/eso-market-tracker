import PageContainer from '../components/PageContainer'

const AuthorizedDevelopers: React.FC = () => (
  <PageContainer pageTitle="Authorized Developers">
    <div className="static-content">
      <strong>Authorized Developers</strong>
      <p>
        The following development teams are authorized to publish this service.
      </p>
      <ul>
        <li>iOS: Apple Team `3DWDB2232S`</li>
      </ul>
    </div>
  </PageContainer>
)

export default AuthorizedDevelopers
