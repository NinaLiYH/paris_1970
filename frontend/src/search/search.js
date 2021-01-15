import React from 'react';
import PropTypes from 'prop-types';
import { Navbar, Footer, LoadingPage } from '../UILibrary/components';
import { getSource } from '../analysisView/analysisView';

class SearchForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            keyword: '',
            photographer: '',
            caption: '',
            tags: [],
            tagFilter: '',
        };
    }

    handleChange = (event) => {
        console.log(event.target);
        this.setState({
            ...this.state,
            [event.target.name]: event.target.value,
        });
    };

    handleSearch = async (body) => {
        const searchResponse = await fetch('/api/search/', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        const searchData = await searchResponse.json();
        let searchText = '';
        if (body.keyword) {
            searchText += 'Keyword: ' + body.keyword + ' ';
        }
        if (body.photographer) {
            searchText += 'Photographed by: ' + body.photographer + ' ';
        }
        if (body.caption) {
            searchText += 'Caption contains: ' + body.caption + ' ';
        }
        if (body.tags && body.tags.length > 0) {
            searchText += 'Has Tags: ' + body.tags;
        }
        this.props.updateSearchData({
            data: searchData,
            isAdvanced: body.isAdvanced,
            searchText,
        });
    };

    handleMultiSelectChange = (event) => {
        console.log(event.target);
        const value = Array.from(event.target.selectedOptions, (option) => option.value);
        this.setState({
            ...this.state,
            tags: value,
        });
    }

    handleFullTextSubmit = async (event) => {
        event.preventDefault();
        if (this.state.keyword) {
            await this.handleSearch({
                keyword: this.state.keyword,
                isAdvanced: false,
            });
        }
    };

    handleAdvancedSubmit = async (event) => {
        event.preventDefault();
        if (this.state.photographer || this.state.caption || this.state.tags) {
            await this.handleSearch({
                photographer: this.state.photographer,
                caption: this.state.caption,
                tags: this.state.tags,
                isAdvanced: true,
            });
        }
    };

    // When it comes to separating the advanced search and full text search ("normal" search),
    // should we split the two forms? I think this would work with the same submit button
    render() {
        const filteredTagData = this.props.tagData.filter(
            (tag) => tag.toLowerCase().includes(this.state.tagFilter.toLowerCase())
        );

        console.log(this.props.tagData);
        console.log(filteredTagData);

        return (
            <div>
                {/* Full-Text Form */}
                <form onSubmit={this.handleFullTextSubmit}>
                    <h3>Full Text Search</h3>
                    <label>
                        <input
                            type="text"
                            name="keyword"
                            value={this.state.keyword}
                            onChange={this.handleChange}
                        />
                    </label>
                    <input type="submit" value="Search" />
                </form>
                {/* Advanced Search Form */}
                <br/><br/>
                <form onSubmit={this.handleAdvancedSubmit}>
                    <h3>Advanced Search</h3>
                    <label>
                        <p>Photographer:&nbsp;
                            <input
                                type="text"
                                name="photographer"
                                value={this.state.photographer}
                                onChange={this.handleChange}
                            />
                        </p>
                    </label>
                    <br/>
                    <label>
                        <p>Caption:&nbsp;
                            <input
                                type="text"
                                name="caption"
                                value={this.state.caption}
                                onChange={this.handleChange}
                            />
                        </p>
                    </label>
                    <br/>
                    <label>
                        <p>Tags:&nbsp;
                            <input
                                type="text"
                                name="tagFilter"
                                value={this.state.tagFilter}
                                onChange={this.handleChange}
                            />
                            <br/>
                            <select
                                name="tags"
                                className='tag-selection'
                                multiple={true}
                                value={this.state.tags}
                                onChange={this.handleMultiSelectChange}
                            >
                                {
                                    filteredTagData.map((tagData, key) => {
                                        return (
                                            <option value={tagData} key={key}>
                                                {tagData}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </p>
                    </label>
                    <br/>
                    <input type="submit" value="Search" />
                </form>
            </div>
        );
    }
}
SearchForm.propTypes = {
    updateSearchData: PropTypes.func,
    tagData: PropTypes.array,
};

export class Search extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            data: null,
            isAdvanced: false,
            searchedText: '',
            tagData: null,
        };
    }

    updateSearchData = (searchData) => {
        this.setState({ ...searchData });
    }

    async componentDidMount() {
        try {
            const tagResponse = await fetch('/api/get_tags/');
            const tagData = await tagResponse.json();
            this.setState({ tagData, loading: false });
        } catch (e) {
            console.log(e);
        }
    }

    // This follows the full text + advanced search model here: http://photogrammar.yale.edu/search/
    render() {
        if (!this.state.tagData) {
            return (<LoadingPage/>);
        }
        return (
            <>
                <Navbar />
                <div className='page'>
                    <br />
                    <h1>Search</h1>
                    <SearchForm
                        updateSearchData={this.updateSearchData}
                        tagData={this.state.tagData}
                    />
                    {
                        this.state.data
                        && <div className='search-results'>
                            <h2>{this.state.searchText}</h2>
                            {this.state.data.map((photo, k) => {
                                const photoId = `${photo['map_square_number']}/${photo['number']}`;
                                if (photo.cleaned_src || photo.front_src) {
                                    return (
                                        <a
                                            key={k}
                                            title={'Map Square: ' + photo['map_square_number']
                                                   + ', Number: ' + photo['number']}
                                            href={'/photo/' + photoId + '/'}
                                        >
                                            <img
                                                alt={photo.alt}
                                                height={100}
                                                width={100}
                                                src={getSource(photo)}
                                            />
                                        </a>
                                    );
                                }
                                return '';
                            })}
                        </div>
                    }
                </div>
                <Footer />
            </>

        );
    }
}
